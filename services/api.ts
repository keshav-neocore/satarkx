import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "./supabase";

export interface LoginResponse {
  id: string;
  username: string;
  email: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  mapStyle: 'simple' | 'satellite' | 'traffic';
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  unlockedAtLevel: number;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  mobile?: string;
  level: string;
  levelNumber: number;
  currentPoints: number;
  maxPoints: number;
  reportCount: number;
  badges: string[];
  avatarUrl?: string;
  avatarType: 'upload' | 'preset';
  gender: 'boy' | 'girl';
  presetId: string;
  preferences: UserPreferences;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  reports: number;
  points: number;
  level: number;
  distance?: string;
  rank?: number;
}

export interface Hazard {
  id: string | number;
  lat: number;
  lng: number;
  type: string;
  title: string;
  severity: 'Critical' | 'Warning' | 'Advisory';
  source: 'User' | 'AI';
  description?: string;
  confidence?: number;
}

export interface Report {
  id: string;
  type: 'image' | 'video';
  url: string;
  timestamp: Date;
  location: { lat: number; lng: number };
  pointsEarned: number;
  status: 'Pending' | 'Verified';
}

export interface Reward {
  id: string;
  status: 'unscratched' | 'scratched';
  value: number;
  type: 'points' | 'badge' | 'multiplier';
  timestamp: Date;
}

export interface FeedItemData {
  id: string;
  type: 'news' | 'official' | 'reel' | 'ad' | 'ai_alert';
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  verified?: boolean;
  image?: string;
  likes?: number;
  videoUrl?: string;
  severity?: 'Critical' | 'Warning' | 'Advisory';
}

export const BADGES: Badge[] = [
  { id: 'b1', name: 'Sentinel', icon: '🛡️', unlockedAtLevel: 1 },
  { id: 'b2', name: 'Guardian', icon: '⚔️', unlockedAtLevel: 2 },
  { id: 'b3', name: 'Elite', icon: '💎', unlockedAtLevel: 3 },
  { id: 'b4', name: 'Master', icon: '👑', unlockedAtLevel: 4 },
  { id: 'b5', name: 'Legend', icon: '🌟', unlockedAtLevel: 5 },
];

export const calculateLevelInfo = (totalPoints: number) => {
  let level = 1;
  let remainingPoints = totalPoints;
  let nextThreshold = 500;

  while (remainingPoints >= nextThreshold) {
    remainingPoints -= nextThreshold;
    level++;
    nextThreshold = level * 500;
  }

  const levelTitles = ["Rookie", "Novice", "Active Guardian", "Veteran Sentinel", "Elite Defender", "Legendary Hero"];
  
  return {
    levelNumber: level,
    title: levelTitles[Math.min(level - 1, levelTitles.length - 1)],
    currentLevelPoints: remainingPoints,
    nextLevelThreshold: nextThreshold,
    badges: BADGES.filter(b => b.unlockedAtLevel <= level).map(b => b.id)
  };
};

let MOCK_REPORTS: Report[] = JSON.parse(localStorage.getItem('satarkx_mock_reports') || '[]').map((r: any) => ({
  ...r,
  timestamp: new Date(r.timestamp)
}));

let MOCK_REWARDS: Reward[] = JSON.parse(localStorage.getItem('satarkx_mock_rewards') || '[]').map((r: any) => ({
  ...r,
  timestamp: new Date(r.timestamp)
}));

const isSupabaseAvailable = !!supabase;
const getActiveUserId = () => localStorage.getItem('satarkx_user_id') || 'guest_user';

export const loginUser = async (username: string, email: string): Promise<LoginResponse> => {
  const levelInfo = calculateLevelInfo(0);
  if (isSupabaseAvailable && supabase) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ 
        email, 
        name: username,
        level: levelInfo.title,
        level_number: levelInfo.levelNumber,
        current_points: 0,
        max_points: levelInfo.nextLevelThreshold,
        report_count: 0,
        badges: levelInfo.badges,
        avatar_type: 'preset',
        gender: 'boy',
        preset_id: username,
        avatar_url: `https://avatar.iran.liara.run/public/boy?username=${username}`,
        preferences: { theme: 'light', mapStyle: 'satellite' }
      }, { onConflict: 'email' })
      .select()
      .single();

    if (error) throw error;
    localStorage.setItem('satarkx_user_id', data.id);
    return { id: data.id, username: data.name, email: data.email };
  } else {
    const mockId = btoa(email);
    const mockUser: UserProfile = {
      id: mockId,
      name: username,
      email: email,
      level: levelInfo.title,
      levelNumber: levelInfo.levelNumber,
      currentPoints: 0,
      maxPoints: levelInfo.nextLevelThreshold,
      reportCount: 0,
      badges: levelInfo.badges,
      avatarUrl: `https://avatar.iran.liara.run/public/boy?username=${username}`,
      avatarType: 'preset',
      gender: 'boy',
      presetId: username,
      preferences: { theme: 'light', mapStyle: 'satellite' }
    };
    localStorage.setItem('satarkx_user_id', mockId);
    localStorage.setItem(`satarkx_profile_${mockId}`, JSON.stringify(mockUser));
    return { id: mockId, username, email };
  }
};

export const fetchUserProfile = async (): Promise<UserProfile> => {
  const userId = getActiveUserId();
  if (isSupabaseAvailable && supabase) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      level: data.level,
      levelNumber: data.level_number,
      currentPoints: data.current_points,
      maxPoints: data.max_points,
      reportCount: data.report_count || 0,
      badges: data.badges || [],
      avatarUrl: data.avatar_url,
      avatarType: data.avatar_type,
      gender: data.gender,
      presetId: data.preset_id,
      preferences: data.preferences
    };
  } else {
    const data = localStorage.getItem(`satarkx_profile_${userId}`);
    if (data) return JSON.parse(data);
    const levelInfo = calculateLevelInfo(0);
    return { name: 'Explorer', email: 'guest@satarkx.in', level: levelInfo.title, levelNumber: levelInfo.levelNumber, currentPoints: 0, maxPoints: levelInfo.nextLevelThreshold, reportCount: 0, badges: levelInfo.badges, avatarType: 'preset', gender: 'boy', presetId: 'Guest', preferences: { theme: 'light', mapStyle: 'satellite' } };
  }
};

export const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
  const userId = getActiveUserId();
  let finalUpdates = { ...updates };
  
  if (updates.currentPoints !== undefined) {
    const levelInfo = calculateLevelInfo(updates.currentPoints);
    finalUpdates.level = levelInfo.title;
    finalUpdates.levelNumber = levelInfo.levelNumber;
    finalUpdates.maxPoints = levelInfo.nextLevelThreshold;
    finalUpdates.badges = levelInfo.badges;
  }

  if (isSupabaseAvailable && supabase) {
    const dbUpdates: any = {};
    if (finalUpdates.name) dbUpdates.name = finalUpdates.name;
    if (finalUpdates.mobile) dbUpdates.mobile = finalUpdates.mobile;
    if (finalUpdates.avatarType) dbUpdates.avatar_type = finalUpdates.avatarType;
    if (finalUpdates.gender) dbUpdates.gender = finalUpdates.gender;
    if (finalUpdates.presetId) dbUpdates.preset_id = finalUpdates.presetId;
    if (finalUpdates.avatarUrl) dbUpdates.avatar_url = finalUpdates.avatarUrl;
    if (finalUpdates.preferences) dbUpdates.preferences = finalUpdates.preferences;
    if (finalUpdates.currentPoints !== undefined) {
        dbUpdates.current_points = finalUpdates.currentPoints;
        dbUpdates.level = finalUpdates.level;
        dbUpdates.level_number = finalUpdates.levelNumber;
        dbUpdates.max_points = finalUpdates.maxPoints;
        dbUpdates.badges = finalUpdates.badges;
    }
    const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', userId);
    if (error) throw error;
    return fetchUserProfile();
  } else {
    const current = await fetchUserProfile();
    const updated = { ...current, ...finalUpdates };
    localStorage.setItem(`satarkx_profile_${userId}`, JSON.stringify(updated));
    return updated;
  }
};

export const submitReport = async (mediaBlob: Blob, lat: number, lng: number, mediaType: 'image' | 'video' = 'image'): Promise<{ success: boolean; points_added: number }> => {
  const userId = getActiveUserId();
  const reportPoints = 100;

  if (!isSupabaseAvailable) {
    const newReport: Report = { id: Date.now().toString(), type: mediaType, url: URL.createObjectURL(mediaBlob), timestamp: new Date(), location: { lat, lng }, pointsEarned: reportPoints, status: 'Verified' };
    MOCK_REPORTS.unshift(newReport);
    localStorage.setItem('satarkx_mock_reports', JSON.stringify(MOCK_REPORTS));
    
    for (let i = 0; i < 3; i++) {
        MOCK_REWARDS.unshift({ id: `r_${Date.now()}_${i}`, status: 'unscratched', value: Math.floor(Math.random() * 50) + 10, type: 'points', timestamp: new Date() });
    }
    localStorage.setItem('satarkx_mock_rewards', JSON.stringify(MOCK_REWARDS));
  }

  const profile = await fetchUserProfile();
  await updateUserProfile({ 
    currentPoints: profile.currentPoints + reportPoints,
    reportCount: (profile.reportCount || 0) + 1
  });

  return { success: true, points_added: reportPoints };
};

export const fetchUserReports = async (): Promise<Report[]> => MOCK_REPORTS;
export const fetchUserRewards = async (): Promise<Reward[]> => MOCK_REWARDS;

export const claimReward = async (rewardId: string): Promise<Reward> => {
  const reward = MOCK_REWARDS.find(r => r.id === rewardId);
  if (reward) {
    reward.status = 'scratched';
    localStorage.setItem('satarkx_mock_rewards', JSON.stringify(MOCK_REWARDS));
    if (reward.type === 'points') {
      const profile = await fetchUserProfile();
      await updateUserProfile({ currentPoints: profile.currentPoints + reward.value });
    }
    return reward;
  }
  throw new Error("Not found");
};

export const fetchLeaderboard = async (): Promise<{ top3: LeaderboardUser[], nearby: LeaderboardUser[] }> => {
    const names = ["Aaryan", "Priya", "Rahul", "Anjali", "Vikram", "Neha", "Arjun", "Kavya", "Siddharth", "Ishani", "Kabir", "Zara", "Yash", "Tanvi", "Rohan", "Sia", "Advait", "Myra"];
    const top3 = names.slice(0, 3).map((name, i) => ({
        id: `top_${i}`, name,
        avatar: `https://avatar.iran.liara.run/public/${i % 2 === 0 ? 'boy' : 'girl'}?username=${name}`,
        reports: 45 - (i * 5), points: 5000 - (i * 400), level: 5 - i, rank: i + 1
    }));
    const nearby = names.slice(3, 18).map((name, i) => ({
        id: `near_${i}`, name,
        avatar: `https://avatar.iran.liara.run/public/${i % 2 === 0 ? 'boy' : 'girl'}?username=${name}`,
        reports: Math.floor(Math.random() * 20) + 1,
        points: Math.floor(Math.random() * 2000), level: Math.floor(Math.random() * 4) + 1,
        distance: `${(Math.random() * 2).toFixed(1)}km away`
    }));
    return { top3, nearby };
};

export const fetchHazards = async (lat: number, lng: number): Promise<Hazard[]> => {
    const userHazards: Hazard[] = Array.from({ length: 3 }).map((_, i) => ({ 
        id: `u_${i}`, 
        lat: lat + (Math.random() - 0.5) * 0.01, 
        lng: lng + (Math.random() - 0.5) * 0.01, 
        type: 'User Report', 
        title: 'Road Blockage',
        severity: 'Warning',
        source: 'User'
    }));
    
    const aiHazards = await fetchAIDetections(lat, lng);
    return [...userHazards, ...aiHazards];
};

// --- NEW: AI DETECTION ENGINE MOCK ---

export const fetchAIDetections = async (lat: number, lng: number): Promise<Hazard[]> => {
    const detections: Hazard[] = [];
    
    // Simulate API calls to Traffic & Weather
    const rainIntensity = Math.random() * 100; // mm/hr
    const trafficSpeed = Math.random() * 80; // km/hr
    const isCameraObstacle = Math.random() < 0.15; // 15% chance of camera detection

    // Rule 1: Flash Flood Risk
    if (rainIntensity > 50 && trafficSpeed < 10) {
        detections.push({
            id: `ai_ff_${Date.now()}`,
            lat: lat + 0.005,
            lng: lng + 0.005,
            type: 'Flash Flood',
            title: 'Critical Flood Risk',
            severity: 'Critical',
            source: 'AI',
            description: `Extreme rain (${rainIntensity.toFixed(0)}mm/hr) & stopped traffic detected.`,
            confidence: 0.92
        });
    }

    // Rule 2: Potential Accident/Blockage
    if (trafficSpeed < 5 && rainIntensity < 5) {
        detections.push({
            id: `ai_acc_${Date.now()}`,
            lat: lat - 0.004,
            lng: lng + 0.002,
            type: 'Accident/Blockage',
            title: 'Potential Accident',
            severity: 'Warning',
            source: 'AI',
            description: "Stationary traffic under clear skies suggests a road blockage.",
            confidence: 0.78
        });
    }

    // Rule 3: Visual Confirmation
    if (isCameraObstacle) {
        detections.push({
            id: `ai_vis_${Date.now()}`,
            lat: lat + (Math.random() - 0.5) * 0.005,
            lng: lng + (Math.random() - 0.5) * 0.005,
            type: 'Visual Hazard',
            title: 'AI Visual Alert',
            severity: 'Critical',
            source: 'AI',
            description: "CV Model confirmed an obstacle via live camera feed analysis.",
            confidence: 0.98
        });
    }

    return detections;
};

export const fetchLivePulseFeed = async (lat: number, lng: number): Promise<FeedItemData[]> => {
    const detections = await fetchAIDetections(lat, lng);
    const aiFeedItems: FeedItemData[] = detections.map(d => ({
        id: String(d.id),
        type: 'ai_alert',
        author: 'SatarkX AI Engine',
        avatar: 'https://avatar.iran.liara.run/public/boy?username=AI',
        content: d.description || d.title,
        timestamp: 'Just Now',
        verified: true,
        severity: d.severity
    }));

    const standardFeed: FeedItemData[] = [
        { id: '1', type: 'news', author: 'Civic Watch', avatar: 'https://avatar.iran.liara.run/public/boy?username=CivicWatch', content: 'Major water logging reported near CP.', timestamp: '15m ago', verified: true, likes: 42 },
        { id: '2', type: 'official', author: 'Delhi Police', avatar: 'https://avatar.iran.liara.run/public/boy?username=TrafficPolice', content: 'Avoid Ring Road near Moolchand.', timestamp: '30m ago' }
    ];

    return [...aiFeedItems, ...standardFeed];
};
