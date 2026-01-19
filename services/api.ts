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

// --- AUTHENTICATION ---

export const signUpUser = async (email: string, password: string, username: string): Promise<SignUpResponse> => {
    if (isSupabaseAvailable && supabase) {
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name: username }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Signup failed. No user returned.");

        // Check if session is established (implies email verified or not required)
        if (!authData.session) {
             return { confirmationRequired: true };
        }

        // 2. Create Profile Entry
        const levelInfo = calculateLevelInfo(0);
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: authData.user.id,
                email: email,
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
            })
            .select()
            .single();
        
        if (profileError) {
             console.error("Profile creation error (Full):", JSON.stringify(profileError, null, 2));
             // If profile creation fails (e.g. RLS), we might still want to return the user but log the error
             // Or throw. Let's throw for now as profile is essential.
             throw new Error(`Profile creation failed: ${profileError.message || JSON.stringify(profileError)}`);
        }

        localStorage.setItem('satarkx_user_id', profileData.id);
        return { user: { id: profileData.id, username: profileData.name, email: profileData.email } };

    } else {
        // --- MOCK SIGN UP IMPLEMENTATION ---
        const mockId = btoa(email);
        const existingUserStr = localStorage.getItem(`satarkx_profile_${mockId}`);

        if (existingUserStr) {
            throw new Error("User already exists. Please Login.");
        }

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
            avatarUrl: `https://avatar.iran.liara.run/public/boy?username=${username}`,
            avatarType: 'preset',
            gender: 'boy',
            presetId: username,
            preferences: { theme: 'light', mapStyle: 'satellite' }
        };

        // Save User Profile
        localStorage.setItem(`satarkx_profile_${mockId}`, JSON.stringify(mockUser));
        // Save Password (Mock only)
        localStorage.setItem(`satarkx_pass_${mockId}`, password);
        
        // Set Active Session
        localStorage.setItem('satarkx_user_id', mockId);
        
        return { user: { id: mockId, username, email } };
    }
};

export const loginUser = async (email: string, password: string, usernameFallback?: string): Promise<LoginResponse> => {
  if (isSupabaseAvailable && supabase) {
    // 1. Sign In
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error("Login Error:", authError);
        // Provide a more helpful error message for the common case
        if (authError.message === 'Invalid login credentials') {
            throw new Error("Invalid credentials. If you just signed up, please check your email for a verification link.");
        }
        throw authError;
    }

    if (!authData.user) throw new Error("Login failed");

    // 2. Fetch Profile to confirm existence
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
    
    // Self-healing: If user exists in Auth but not in Profiles (e.g. from failed signup), create it now.
    if (profileError || !profileData) {
        console.warn("User has auth but no profile. Attempting to create profile...");
        const levelInfo = calculateLevelInfo(0);
        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
                id: authData.user.id,
                email: email,
                name: usernameFallback || email.split('@')[0],
                level: levelInfo.title,
                level_number: levelInfo.levelNumber,
                current_points: 0,
                max_points: levelInfo.nextLevelThreshold,
                report_count: 0,
                badges: levelInfo.badges,
                avatar_type: 'preset',
                gender: 'boy',
                preset_id: email.split('@')[0],
                avatar_url: `https://avatar.iran.liara.run/public/boy?username=${email.split('@')[0]}`,
                preferences: { theme: 'light', mapStyle: 'satellite' }
            })
            .select()
            .single();
        
        if (createError) {
             console.error("Failed to recover profile:", JSON.stringify(createError, null, 2));
             // Don't throw here if we can't create profile, maybe return partial data or try guest?
             // But actually, we need a profile.
             throw new Error("User profile missing and could not be created.");
        }
        
        localStorage.setItem('satarkx_user_id', newProfile.id);
        return { id: newProfile.id, username: newProfile.name, email: newProfile.email };
    }

    localStorage.setItem('satarkx_user_id', profileData.id);
    return { id: profileData.id, username: profileData.name, email: profileData.email };

  } else {
    // --- MOCK LOGIN IMPLEMENTATION ---
    const mockId = btoa(email);
    const existingUserStr = localStorage.getItem(`satarkx_profile_${mockId}`);
    
    if (!existingUserStr) {
        throw new Error("User not found. Please Sign Up.");
    }

    const storedPass = localStorage.getItem(`satarkx_pass_${mockId}`);
    
    // In mock mode, we check equality
    if (!storedPass || storedPass !== password) {
        throw new Error("Invalid password.");
    }
    
    const user = JSON.parse(existingUserStr);
    localStorage.setItem('satarkx_user_id', mockId);
    return { id: mockId, username: user.name, email: user.email };
  }
};

export const resetUserPassword = async (email: string, newPassword: string): Promise<boolean> => {
  if (isSupabaseAvailable && supabase) {
      // For Supabase, we would typically trigger a reset email.
      // supabase.auth.resetPasswordForEmail(email)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
      });
      if (error) throw error;
      return true; // Email sent
  } else {
      // --- MOCK RESET IMPLEMENTATION ---
      const mockId = btoa(email);
      const existingUserStr = localStorage.getItem(`satarkx_profile_${mockId}`);
      
      if (!existingUserStr) {
          throw new Error("User with this email does not exist.");
      }

      // Update the password in local storage
      localStorage.setItem(`satarkx_pass_${mockId}`, newPassword);
      return true;
  }
};

export const fetchUserProfile = async (): Promise<UserProfile> => {
  const userId = getActiveUserId();
  if (isSupabaseAvailable && supabase) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
        // Fallback for demo: If fetching fails, return a guest object to prevent crash
        console.error("Error fetching profile:", JSON.stringify(error, null, 2));
        
        // Try to recover if it's just missing row but we have a session
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session && sessionData.session.user.id === userId) {
             const levelInfo = calculateLevelInfo(0);
             // Attempt to fix on the fly (Silent fix)
             await supabase.from('profiles').insert({
                id: userId,
                email: sessionData.session.user.email || 'recovered@satarkx.in',
                name: 'Recovered User',
                level: levelInfo.title,
                level_number: levelInfo.levelNumber,
                current_points: 0,
                max_points: levelInfo.nextLevelThreshold,
                report_count: 0,
                badges: levelInfo.badges,
                avatar_type: 'preset',
                gender: 'boy',
                preset_id: 'Recovered',
                avatar_url: `https://avatar.iran.liara.run/public/boy?username=Recovered`,
                preferences: { theme: 'light', mapStyle: 'satellite' }
            });
             // Retry fetch once
             const retry = await supabase.from('profiles').select('*').eq('id', userId).single();
             if (retry.data) {
                 const d = retry.data;
                 return {
                    id: d.id, name: d.name, email: d.email, mobile: d.mobile,
                    level: d.level, levelNumber: d.level_number,
                    currentPoints: d.current_points, maxPoints: d.max_points,
                    reportCount: d.report_count || 0, badges: d.badges || [],
                    avatarUrl: d.avatar_url, avatarType: d.avatar_type,
                    gender: d.gender, presetId: d.preset_id, preferences: d.preferences
                 };
             }
        }
        
        // Ultimate Fallback
        const levelInfo = calculateLevelInfo(0);
        return { 
            name: 'Guest Explorer', email: 'guest@satarkx.in', 
            level: levelInfo.title, levelNumber: levelInfo.levelNumber, 
            currentPoints: 0, maxPoints: levelInfo.nextLevelThreshold, 
            reportCount: 0, badges: levelInfo.badges, 
            avatarType: 'preset', gender: 'boy', presetId: 'Guest', 
            preferences: { theme: 'light', mapStyle: 'satellite' } 
        };
    }

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
    
    // If no user found in local storage (e.g. fresh load or zombie ID), return a guest object
    const levelInfo = calculateLevelInfo(0);
    return { 
        name: 'Guest Explorer', 
        email: 'guest@satarkx.in', 
        level: levelInfo.title, 
        levelNumber: levelInfo.levelNumber, 
        currentPoints: 0, 
        maxPoints: levelInfo.nextLevelThreshold, 
        reportCount: 0, 
        badges: levelInfo.badges, 
        avatarType: 'preset', 
        gender: 'boy', 
        presetId: 'Guest', 
        preferences: { theme: 'light', mapStyle: 'satellite' } 
    };
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
    // Only save if it's a real user (not the guest fallback)
    if (userId !== 'guest_user') {
        localStorage.setItem(`satarkx_profile_${userId}`, JSON.stringify(updated));
    }
    return updated;
  }
};

export const submitReport = async (mediaBlob: Blob, lat: number, lng: number, mediaType: 'image' | 'video' = 'image'): Promise<{ success: boolean; points_added: number }> => {
  const userId = getActiveUserId();
  const reportPoints = 100;
  const mediaUrl = URL.createObjectURL(mediaBlob); // In a real app with Supabase Storage, upload first, then use that URL.

  if (isSupabaseAvailable && supabase) {
      // 1. Insert Report into DB
      const { error } = await supabase.from('reports').insert({
          user_id: userId,
          type: mediaType,
          url: mediaUrl, // Note: This Blob URL is local-only. Real production needs Storage bucket upload.
          location_lat: lat,
          location_lng: lng,
          points_earned: reportPoints,
          status: 'Verified'
      });
      if (error) console.error("Report Insert Error:", JSON.stringify(error, null, 2));

      // 2. Generate Rewards (Random chance)
      const { error: rewardError } = await supabase.from('rewards').insert(
          Array.from({ length: 3 }).map(() => ({
              user_id: userId,
              status: 'unscratched',
              value: Math.floor(Math.random() * 50) + 10,
              type: 'points'
          }))
      );
      if (rewardError) console.error("Reward Gen Error:", JSON.stringify(rewardError, null, 2));

  } else {
      // Mock Fallback
      const newReport: Report = { id: Date.now().toString(), type: mediaType, url: mediaUrl, timestamp: new Date(), location: { lat, lng }, pointsEarned: reportPoints, status: 'Verified' };
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

export const fetchUserReports = async (): Promise<Report[]> => {
    if (isSupabaseAvailable && supabase) {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .eq('user_id', getActiveUserId())
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error(JSON.stringify(error, null, 2));
            return [];
        }

        return data.map((r: any) => ({
            id: r.id,
            type: r.type,
            url: r.url,
            timestamp: new Date(r.created_at),
            location: { lat: r.location_lat, lng: r.location_lng },
            pointsEarned: r.points_earned,
            status: r.status
        }));
    }
    return MOCK_REPORTS;
};

export const fetchUserRewards = async (): Promise<Reward[]> => {
    if (isSupabaseAvailable && supabase) {
        const { data, error } = await supabase
            .from('rewards')
            .select('*')
            .eq('user_id', getActiveUserId())
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error(JSON.stringify(error, null, 2));
            return [];
        }
        return data.map((r: any) => ({
            ...r,
            timestamp: new Date(r.created_at)
        }));
    }
    return MOCK_REWARDS;
};

export const claimReward = async (rewardId: string): Promise<Reward> => {
  if (isSupabaseAvailable && supabase) {
      const { data, error } = await supabase
        .from('rewards')
        .update({ status: 'scratched' })
        .eq('id', rewardId)
        .select()
        .single();
      
      if (error || !data) throw new Error("Failed to claim reward");

      const reward = { ...data, timestamp: new Date(data.created_at) } as Reward;
      
      if (reward.type === 'points') {
        const profile = await fetchUserProfile();
        await updateUserProfile({ currentPoints: profile.currentPoints + reward.value });
      }
      return reward;
  } 
  
  // Mock Fallback
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
    // Note: Implementing real leaderboard queries requires complex aggregation (SUM of points/reports).
    // For now, we will stick to the mock data for the leaderboard display to keep the demo visual intact.
    // In a real app, this would be a Supabase RPC function or a View.
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
    let userHazards: Hazard[] = [];

    if (isSupabaseAvailable && supabase) {
        // Fetch real user reports as hazards
        const { data } = await supabase.from('hazards').select('*');
        if (data) {
             userHazards = data.map((h: any) => ({
                 id: h.id,
                 lat: h.latitude,
                 lng: h.longitude,
                 type: h.type,
                 title: h.title,
                 severity: h.severity,
                 source: h.source,
                 description: h.description,
                 confidence: h.confidence
             }));
        }
    } else {
         userHazards = Array.from({ length: 3 }).map((_, i) => ({ 
            id: `u_${i}`, 
            lat: lat + (Math.random() - 0.5) * 0.01, 
            lng: lng + (Math.random() - 0.5) * 0.01, 
            type: 'User Report', 
            title: 'Road Blockage',
            severity: 'Warning',
            source: 'User'
        }));
    }
    
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