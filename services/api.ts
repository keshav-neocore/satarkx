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
  // Predictive Features
  isPredictive?: boolean;
  predictionTime?: string; // e.g. "in 2 hours"
  probability?: number; // 0 to 1
  // Author Details for User Reports
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
  // Predictive Features for Feed
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

const isSupabaseAvailable = !!supabase;
const getActiveUserId = () => localStorage.getItem('satarkx_user_id') || 'guest_user';

const getAvatarUrl = (seed: string) => `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

// Helper to convert Blob to Base64 (for reliable mock storage)
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

        if (!authData.session) {
             return { confirmationRequired: true };
        }

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
                avatar_url: getAvatarUrl(username),
                preferences: { theme: 'light', mapStyle: 'satellite' }
            })
            .select()
            .single();
        
        if (profileError) {
             console.error("Profile creation error (Full):", JSON.stringify(profileError, null, 2));
        }

        localStorage.setItem('satarkx_user_id', authData.user.id);
        return { user: { id: authData.user.id, username, email } };

    } else {
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
    }
};

export const loginUser = async (email: string, password: string, usernameFallback?: string): Promise<LoginResponse> => {
  if (isSupabaseAvailable && supabase) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        if (authError.message === 'Invalid login credentials') {
            throw new Error("Invalid credentials. If you just signed up, please check your email for a verification link.");
        }
        throw authError;
    }

    if (!authData.user) throw new Error("Login failed");

    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
    
    if (profileError || !profileData) {
        console.warn("User has auth but no profile. Attempting to create profile...");
        const levelInfo = calculateLevelInfo(0);
        const username = usernameFallback || email.split('@')[0];
        const { data: newProfile, error: createError } = await supabase
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
                avatar_url: getAvatarUrl(username),
                preferences: { theme: 'light', mapStyle: 'satellite' }
            })
            .select()
            .single();
        
        if (createError) {
             localStorage.setItem('satarkx_user_id', authData.user.id);
             return { id: authData.user.id, username: "Explorer", email };
        }
        
        localStorage.setItem('satarkx_user_id', newProfile.id);
        return { id: newProfile.id, username: newProfile.name, email: newProfile.email };
    }

    localStorage.setItem('satarkx_user_id', profileData.id);
    return { id: profileData.id, username: profileData.name, email: profileData.email };

  } else {
    const mockId = btoa(email);
    const existingUserStr = localStorage.getItem(`satarkx_profile_${mockId}`);
    
    if (!existingUserStr) {
        throw new Error("User not found. Please Sign Up.");
    }

    const storedPass = localStorage.getItem(`satarkx_pass_${mockId}`);
    
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
      });
      if (error) throw error;
      return true;
  } else {
      const mockId = btoa(email);
      const existingUserStr = localStorage.getItem(`satarkx_profile_${mockId}`);
      if (!existingUserStr) throw new Error("User with this email does not exist.");
      localStorage.setItem(`satarkx_pass_${mockId}`, newPassword);
      return true;
  }
};

export const fetchUserProfile = async (): Promise<UserProfile> => {
  const userId = getActiveUserId();
  if (isSupabaseAvailable && supabase) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error || !data) {
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
    }
    return {
      id: data.id, name: data.name, email: data.email, mobile: data.mobile,
      level: data.level, levelNumber: data.level_number,
      currentPoints: data.current_points, maxPoints: data.max_points,
      reportCount: data.report_count || 0, badges: data.badges || [],
      avatarUrl: data.avatar_url, avatarType: data.avatar_type,
      gender: data.gender, presetId: data.preset_id, preferences: data.preferences
    };
  } else {
    const data = localStorage.getItem(`satarkx_profile_${userId}`);
    if (data) {
        const parsed = JSON.parse(data);
        if (!parsed.avatarUrl) {
            parsed.avatarUrl = getAvatarUrl(parsed.presetId || parsed.name || 'Guest');
        }
        
        // --- SYNC FIX ---
        // Ensure reportCount matches the actual mock reports count
        const actualCount = MOCK_REPORTS.length;
        if (parsed.reportCount !== actualCount) {
            parsed.reportCount = actualCount;
            // Persist the correction
            if (userId !== 'guest_user') {
                localStorage.setItem(`satarkx_profile_${userId}`, JSON.stringify(parsed));
            }
        }
        // ----------------

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
    if (userId !== 'guest_user') localStorage.setItem(`satarkx_profile_${userId}`, JSON.stringify(updated));
    return updated;
  }
};

interface ReportResult {
  success: boolean;
  points_added: number;
  error?: string;
  impact?: {
    accuracy: string;
    timeSaved: string;
    reduction: string;
  };
}

export const submitReport = async (mediaBlob: Blob, lat: number, lng: number, mediaType: 'image' | 'video' = 'image'): Promise<ReportResult> => {
  const reportPoints = 100;
  
  // Simulated Impact Stats
  const impact = {
    accuracy: '>95%',
    timeSaved: '12m 30s',
    reduction: '15%'
  };

  let sessionUserId: string | null = null;
  let finalMediaUrl = ''; 

  if (isSupabaseAvailable && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        sessionUserId = user.id;

        try {
            const timestamp = Date.now();
            const fileExt = mediaType === 'video' ? 'webm' : 'jpg';
            const fileName = `${sessionUserId}/${timestamp}.${fileExt}`;
            const mimeType = mediaType === 'video' ? 'video/webm' : 'image/jpeg';

            const fileBody = new File([mediaBlob], `${timestamp}.${fileExt}`, { type: mimeType });

            const { data, error: uploadError } = await supabase.storage
                .from('satark-media') 
                .upload(fileName, fileBody, {
                    contentType: mimeType,
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error("Storage Upload Error Details:", JSON.stringify(uploadError, null, 2));
                throw new Error(uploadError.message);
            } 
            
            const { data: { publicUrl } } = supabase.storage
                .from('satark-media') 
                .getPublicUrl(fileName);
            
            finalMediaUrl = publicUrl;

            const { error: dbError } = await supabase.from('reports').insert({
                user_id: sessionUserId,
                type: mediaType,
                url: finalMediaUrl,
                location_lat: lat,
                location_lng: lng,
                points_earned: reportPoints,
                status: 'Verified'
            });
            
            if (dbError) throw new Error(dbError.message);

            await supabase.from('rewards').insert(
                Array.from({ length: 3 }).map(() => ({
                    user_id: sessionUserId,
                    status: 'unscratched',
                    value: Math.floor(Math.random() * 50) + 10,
                    type: 'points'
                }))
            );

        } catch (err: any) {
            console.warn("Falling back to local mock storage due to error.");
            return submitMockReport(mediaBlob, lat, lng, mediaType);
        }

      } else {
        return submitMockReport(mediaBlob, lat, lng, mediaType);
      }
  } else {
      return submitMockReport(mediaBlob, lat, lng, mediaType);
  }

  const profile = await fetchUserProfile();
  await updateUserProfile({ 
    currentPoints: profile.currentPoints + reportPoints,
    reportCount: (profile.reportCount || 0) + 1
  });

  return { success: true, points_added: reportPoints, impact };
};

const submitMockReport = async (mediaBlob: Blob, lat: number, lng: number, mediaType: 'image' | 'video'): Promise<ReportResult> => {
    let finalMediaUrl = '';
    const reportPoints = 100;
    try {
        finalMediaUrl = await blobToBase64(mediaBlob);
    } catch (e) {
        finalMediaUrl = URL.createObjectURL(mediaBlob);
    }

    const newReport: Report = { id: Date.now().toString(), type: mediaType, url: finalMediaUrl, timestamp: new Date(), location: { lat, lng }, pointsEarned: reportPoints, status: 'Verified' };
    MOCK_REPORTS.unshift(newReport);
    localStorage.setItem('satarkx_mock_reports', JSON.stringify(MOCK_REPORTS));
    
    for (let i = 0; i < 3; i++) {
        MOCK_REWARDS.unshift({ id: `r_${Date.now()}_${i}`, status: 'unscratched', value: Math.floor(Math.random() * 50) + 10, type: 'points', timestamp: new Date() });
    }
    localStorage.setItem('satarkx_mock_rewards', JSON.stringify(MOCK_REWARDS));

    const profile = await fetchUserProfile();
    await updateUserProfile({ 
      currentPoints: profile.currentPoints + reportPoints,
      reportCount: (profile.reportCount || 0) + 1
    });

    return { 
        success: true, 
        points_added: reportPoints,
        impact: {
            accuracy: '>95%',
            timeSaved: '14m 20s',
            reduction: '15%'
        }
    };
};

export const fetchUserReports = async (): Promise<Report[]> => {
    let userId = getActiveUserId();
    if (isSupabaseAvailable && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) userId = user.id;

        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) return [];

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
    let userId = getActiveUserId();
    if (isSupabaseAvailable && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) userId = user.id;

        const { data, error } = await supabase
            .from('rewards')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) return [];
        return data.map((r: any) => ({ ...r, timestamp: new Date(r.created_at) }));
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
        avatar: getAvatarUrl(name),
        reports: 45 - (i * 5), points: 5000 - (i * 400), level: 5 - i, rank: i + 1
    }));
    const nearby = names.slice(3, 18).map((name, i) => ({
        id: `near_${i}`, name,
        avatar: getAvatarUrl(name),
        reports: Math.floor(Math.random() * 20) + 1,
        points: Math.floor(Math.random() * 2000), level: Math.floor(Math.random() * 4) + 1,
        distance: `${(Math.random() * 2).toFixed(1)}km away`
    }));
    return { top3, nearby };
};

export const fetchHazards = async (lat: number, lng: number): Promise<Hazard[]> => {
    let userHazards: Hazard[] = [];

    if (isSupabaseAvailable && supabase) {
        const { data } = await supabase.from('hazards').select('*');
        if (data && data.length > 0) {
             userHazards = data.map((h: any) => ({
                 id: h.id, lat: h.latitude, lng: h.longitude,
                 type: h.type, title: h.title, severity: h.severity,
                 source: h.source, description: h.description, confidence: h.confidence,
                 imageUrl: h.image_url 
             }));
        }
    } 
    
    // If no real data (or mock mode), generate diverse random user reports with images and authors
    if (userHazards.length === 0) {
         
         const mockUsers = [
             { name: 'Rohan_K', level: 4, avatar: getAvatarUrl('Rohan_K') },
             { name: 'Priya.S', level: 3, avatar: getAvatarUrl('Priya.S') },
             { name: 'Amit_99', level: 5, avatar: getAvatarUrl('Amit_99') },
             { name: 'Zara_X', level: 2, avatar: getAvatarUrl('Zara_X') },
             { name: 'Dev_G', level: 4, avatar: getAvatarUrl('Dev_G') }
         ];

         const reportTypes = [
             { title: 'Deep Pothole', type: 'Road Damage', severity: 'Warning', desc: 'Large pothole in the middle lane.', img: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400' },
             { title: 'Broken Signal', type: 'Infrastructure', severity: 'Critical', desc: 'Signal stuck on red, causing chaos.', img: 'https://images.unsplash.com/photo-1569429569766-3d2b638a5369?auto=format&fit=crop&q=80&w=400' },
             { title: 'Construction Debris', type: 'Obstruction', severity: 'Advisory', desc: 'Sand and bricks on the side.', img: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400' },
             { title: 'Water Leakage', type: 'Civic Issue', severity: 'Advisory', desc: 'Pipeline burst leaking clean water.', img: 'https://images.unsplash.com/photo-1524143878564-8833b288a442?auto=format&fit=crop&q=80&w=400' },
             { title: 'Stray Cattle', type: 'Hazard', severity: 'Warning', desc: 'Herd blocking the turn.', img: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&q=80&w=400' },
             { title: 'Traffic Gridlock', type: 'Road Hazard', severity: 'Warning', desc: 'Stuck for 20 mins.', img: 'https://images.unsplash.com/photo-1566236402446-55938d813470?auto=format&fit=crop&q=80&w=400' }
         ];

         userHazards = Array.from({ length: 5 }).map((_, i) => {
            const template = reportTypes[Math.floor(Math.random() * reportTypes.length)];
            const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
            return { 
                id: `u_mock_${i}_${Date.now()}`, 
                lat: lat + (Math.random() - 0.5) * 0.008, 
                lng: lng + (Math.random() - 0.5) * 0.008, 
                type: template.type, 
                title: template.title, 
                severity: template.severity as any, 
                source: 'User',
                description: template.desc,
                imageUrl: template.img,
                authorName: user.name,
                authorLevel: user.level,
                authorAvatar: user.avatar,
                reportTime: `${Math.floor(Math.random() * 50) + 2}m ago`
            };
        });
    }
    
    const aiHazards = await fetchAIDetections(lat, lng);
    return [...userHazards, ...aiHazards];
};

export const fetchAIDetections = async (lat: number, lng: number): Promise<Hazard[]> => {
    try {
        // Fallback to local Python backend if available (removed Vercel path)
        const response = await fetch(`http://localhost:8000/ai/scan?lat=${lat}&lng=${lng}`);
        if (response.ok) {
            const data = await response.json();
            return data;
        }
    } catch (e) {
        // Backend not running, fallback to mocks
        console.warn("SatarkX AI Backend offline, using embedded simulation.");
    }

    // --- FALLBACK MOCK DATA ---
    const detections: Hazard[] = [];
    
    // 1. Guaranteed AI Detections for Demo
    detections.push({
        id: `ai_traffic_${Date.now()}`, 
        lat: lat + 0.003, 
        lng: lng - 0.002,
        type: 'Traffic', title: 'Heavy Congestion', severity: 'Warning', source: 'AI',
        description: "Traffic moving at <10km/h. High volume detected.", confidence: 0.95
    });

    detections.push({
        id: `ai_weather_${Date.now()}`, 
        lat: lat - 0.004, 
        lng: lng + 0.003,
        type: 'Weather', title: 'Low Visibility', severity: 'Advisory', source: 'AI',
        description: "Fog density increasing. Visibility < 50m.", confidence: 0.88
    });

    // 2. Predictive Hazards (Future)
    // Add distinct predictive hazards scattered
    detections.push({
        id: `ai_pred_1_${Date.now()}`, 
        lat: lat + 0.006, 
        lng: lng + 0.004,
        type: 'Predictive', title: 'Waterlogging Risk', severity: 'Warning', source: 'AI',
        description: "Drainage topology + Rain Forecast.", 
        confidence: 0.82,
        isPredictive: true,
        predictionTime: "in 1 hr",
        probability: 0.85
    });

    detections.push({
        id: `ai_pred_2_${Date.now()}`, 
        lat: lat - 0.005, 
        lng: lng - 0.005,
        type: 'Predictive', title: 'Gridlock Forecast', severity: 'Critical', source: 'AI',
        description: "Protest march route intersects here.", 
        confidence: 0.75,
        isPredictive: true,
        predictionTime: "in 30 mins",
        probability: 0.92
    });

    // 3. Random Chance Hazards
    if (Math.random() > 0.5) {
        detections.push({
            id: `ai_acc_${Date.now()}`, lat: lat + 0.001, lng: lng + 0.001,
            type: 'Accident', title: 'Vehicle Breakdown', severity: 'Warning', source: 'AI',
            description: "Stationary vehicle detected on flyover.", confidence: 0.89
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
        avatar: getAvatarUrl('AI'),
        content: d.description || d.title, 
        timestamp: d.isPredictive ? 'Future Forecast' : 'Just Now', 
        verified: true, 
        severity: d.severity,
        // Pass predictive props
        isPredictive: d.isPredictive,
        probability: d.probability,
        predictionTime: d.predictionTime
    }));

    const standardFeed: FeedItemData[] = [
        { id: '1', type: 'news', author: 'Civic Watch', avatar: getAvatarUrl('CivicWatch'), content: 'Major water logging reported near CP.', timestamp: '15m ago', verified: true, likes: 42 },
        { id: '2', type: 'official', author: 'Delhi Police', avatar: getAvatarUrl('TrafficPolice'), content: 'Avoid Ring Road near Moolchand.', timestamp: '30m ago' }
    ];

    return [...aiFeedItems, ...standardFeed];
};