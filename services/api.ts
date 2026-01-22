import { supabase } from "./supabase";

export interface LoginResponse {
  id: string;
  username: string;
  email: string;
}

export interface SignUpResponse {
    user?: LoginResponse;
    confirmationRequired?: boolean;
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
  imageUrl?: string;
  isPredictive?: boolean;
  predictionTime?: string;
  probability?: number;
  authorName?: string;
  authorLevel?: number;
  authorAvatar?: string;
  reportTime?: string;
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
  isPredictive?: boolean;
  probability?: number;
  predictionTime?: string;
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

const getActiveUserId = () => localStorage.getItem('satarkx_user_id') || 'guest_user';
const getAvatarUrl = (seed: string) => `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- AUTHENTICATION ---

export const signUpUser = async (email: string, password: string, username: string): Promise<SignUpResponse> => {
    if (password.length < 6) throw new Error("Password should be at least 6 characters.");
    const mockId = btoa(email);
    const levelInfo = calculateLevelInfo(0);
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
        avatarUrl: getAvatarUrl(username),
        avatarType: 'preset',
        gender: 'boy',
        presetId: username,
        preferences: { theme: 'light', mapStyle: 'satellite' }
    };
    localStorage.setItem(`satarkx_profile_${mockId}`, JSON.stringify(mockUser));
    localStorage.setItem(`satarkx_pass_${mockId}`, password);
    localStorage.setItem('satarkx_user_id', mockId);
    return { user: { id: mockId, username, email } };
};

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
    const mockId = btoa(email);
    const existingUserStr = localStorage.getItem(`satarkx_profile_${mockId}`);
    
    if (!existingUserStr) {
        throw new Error("Account not found. Please Sign Up first.");
    }

    const storedPass = localStorage.getItem(`satarkx_pass_${mockId}`);
    if (storedPass !== password) {
        throw new Error("Invalid password.");
    }

    const user = JSON.parse(existingUserStr);
    localStorage.setItem('satarkx_user_id', mockId);
    return { id: mockId, username: user.name, email: user.email };
};

export const resetUserPassword = async (email: string, newPassword: string): Promise<boolean> => {
    const mockId = btoa(email);
    const existingUserStr = localStorage.getItem(`satarkx_profile_${mockId}`);
    if (!existingUserStr) throw new Error("Account not found.");
    
    localStorage.setItem(`satarkx_pass_${mockId}`, newPassword);
    return true;
};

export const fetchUserProfile = async (): Promise<UserProfile> => {
  const userId = getActiveUserId();
  const data = localStorage.getItem(`satarkx_profile_${userId}`);
  if (data) {
      const parsed = JSON.parse(data);
      parsed.reportCount = MOCK_REPORTS.length;
      return parsed;
  }
  const levelInfo = calculateLevelInfo(0);
  return { 
      name: 'Guest Explorer', email: 'guest@satarkx.in', 
      level: levelInfo.title, levelNumber: levelInfo.levelNumber, 
      currentPoints: 0, maxPoints: levelInfo.nextLevelThreshold, 
      reportCount: 0, badges: levelInfo.badges, 
      avatarType: 'preset', gender: 'boy', presetId: 'Guest', 
      avatarUrl: getAvatarUrl('Guest'), 
      preferences: { theme: 'light', mapStyle: 'satellite' } 
  };
};

export const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
  const userId = getActiveUserId();
  const current = await fetchUserProfile();
  const updated = { ...current, ...updates };
  if (updates.currentPoints !== undefined) {
    const levelInfo = calculateLevelInfo(updates.currentPoints);
    updated.level = levelInfo.title;
    updated.levelNumber = levelInfo.levelNumber;
    updated.maxPoints = levelInfo.nextLevelThreshold;
    updated.badges = levelInfo.badges;
  }
  localStorage.setItem(`satarkx_profile_${userId}`, JSON.stringify(updated));
  return updated;
};

export const submitReport = async (mediaBlob: Blob, lat: number, lng: number, mediaType: 'image' | 'video' = 'image'): Promise<any> => {
    const b64 = await blobToBase64(mediaBlob);
    const newReport: Report = { 
        id: Date.now().toString(), 
        type: mediaType, 
        url: b64, 
        timestamp: new Date(), 
        location: { lat, lng }, 
        pointsEarned: 100, 
        status: 'Verified' 
    };
    MOCK_REPORTS.unshift(newReport);
    localStorage.setItem('satarkx_mock_reports', JSON.stringify(MOCK_REPORTS));
    
    for (let i = 0; i < 3; i++) {
        MOCK_REWARDS.unshift({ id: `r_${Date.now()}_${i}`, status: 'unscratched', value: Math.floor(Math.random() * 50) + 10, type: 'points', timestamp: new Date() });
    }
    localStorage.setItem('satarkx_mock_rewards', JSON.stringify(MOCK_REWARDS));

    const profile = await fetchUserProfile();
    await updateUserProfile({ currentPoints: profile.currentPoints + 100 });

    return { success: true, points_added: 100, impact: { accuracy: '>98%', timeSaved: '14m', reduction: '18%' } };
};

export const fetchUserReports = async (): Promise<Report[]> => MOCK_REPORTS;

export const deleteUserReport = async (reportId: string): Promise<boolean> => {
    const initialLength = MOCK_REPORTS.length;
    MOCK_REPORTS = MOCK_REPORTS.filter(r => r.id !== reportId);
    
    if (MOCK_REPORTS.length !== initialLength) {
        localStorage.setItem('satarkx_mock_reports', JSON.stringify(MOCK_REPORTS));
        return true;
    }
    return false;
};

export const fetchUserRewards = async (): Promise<Reward[]> => MOCK_REWARDS;

export const claimReward = async (rewardId: string): Promise<Reward> => {
  const reward = MOCK_REWARDS.find(r => r.id === rewardId);
  if (reward) {
    reward.status = 'scratched';
    localStorage.setItem('satarkx_mock_rewards', JSON.stringify(MOCK_REWARDS));
    const profile = await fetchUserProfile();
    await updateUserProfile({ currentPoints: profile.currentPoints + reward.value });
    return reward;
  }
  throw new Error("Reward not found");
};

export const fetchLeaderboard = async (): Promise<any> => {
    const names = ["Aaryan", "Priya", "Rahul", "Anjali", "Vikram"];
    const top3 = names.slice(0, 3).map((name, i) => ({
        id: `t_${i}`, name, avatar: getAvatarUrl(name), reports: 40-i*5, points: 5000-i*500, level: 5-i, rank: i+1
    }));
    const nearby = names.slice(3).map((name, i) => ({
        id: `n_${i}`, name, avatar: getAvatarUrl(name), reports: 12, points: 1200, level: 2, distance: '1.2km'
    }));
    return { top3, nearby };
};

// --- CORE AI LOGIC ---

export const fetchAIDetections = async (lat: number, lng: number): Promise<Hazard[]> => {
    // Artificial delay for "Neural Scan" feel
    await new Promise(r => setTimeout(r, 800));

    const detections: Hazard[] = [];
    const seed = Math.floor((Math.abs(lat) + Math.abs(lng)) * 1000);
    
    // Deterministic random generator for stability
    const pseudoRandom = (offset: number) => {
        const x = Math.sin(seed + offset) * 10000;
        return x - Math.floor(x);
    };

    // 1. Traffic Detection
    if (pseudoRandom(1) > 0.2) {
        detections.push({
            id: `ai_tr_${seed}`,
            lat: lat + (pseudoRandom(2) - 0.5) * 0.005,
            lng: lng + (pseudoRandom(3) - 0.5) * 0.005,
            type: 'Traffic', title: 'Heavy Congestion', severity: 'Warning', source: 'AI',
            description: `AI detects vehicle density at ${(pseudoRandom(4)*20 + 75).toFixed(0)}%.`,
            confidence: 0.94
        });
    }

    // 2. Predictive Hazard
    if (pseudoRandom(5) > 0.4) {
        const prob = 0.7 + pseudoRandom(6) * 0.25;
        detections.push({
            id: `ai_pr_${seed}`,
            lat: lat + (pseudoRandom(7) - 0.5) * 0.008,
            lng: lng + (pseudoRandom(8) - 0.5) * 0.008,
            type: 'Predictive', title: 'Waterlogging Forecast', 
            severity: prob > 0.85 ? 'Critical' : 'Warning', source: 'AI',
            description: "Topographical analysis predicts flooding risk.",
            confidence: prob, isPredictive: true, 
            predictionTime: `in ${Math.floor(pseudoRandom(9)*3)+1} hours`,
            probability: prob
        });
    }

    return detections;
};

export const fetchHazards = async (lat: number, lng: number): Promise<Hazard[]> => {
    const aiHazards = await fetchAIDetections(lat, lng);
    // User mock hazards
    const userHazards: Hazard[] = [
        {
            id: 'u_1', lat: lat + 0.001, lng: lng - 0.002, type: 'Road Damage', title: 'Large Pothole',
            severity: 'Warning', source: 'User', authorName: 'Rohan_K', authorLevel: 4, 
            authorAvatar: getAvatarUrl('Rohan'), reportTime: '5m ago',
            imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400'
        }
    ];
    return [...aiHazards, ...userHazards];
};

export const fetchLivePulseFeed = async (lat: number, lng: number): Promise<FeedItemData[]> => {
    const ai = await fetchAIDetections(lat, lng);
    const aiItems: FeedItemData[] = ai.map(h => ({
        id: String(h.id), type: 'ai_alert', author: 'SatarkX AI', avatar: getAvatarUrl('AI'),
        content: h.description || h.title, timestamp: 'JUST NOW', severity: h.severity,
        isPredictive: h.isPredictive, probability: h.probability, predictionTime: h.predictionTime
    }));
    return [...aiItems, { id: 'f1', type: 'news', author: 'Traffic Police', avatar: getAvatarUrl('Police'), content: 'Major jam at Ring Road.', timestamp: '10m ago' }];
};