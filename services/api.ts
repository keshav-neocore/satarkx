// This service handles communication with the backend.

export interface LoginResponse {
  id: number;
  [key: string]: any;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  mapStyle: 'simple' | 'satellite';
}

export interface UserProfile {
  name: string;
  email: string;
  mobile?: string;
  level: string;
  levelNumber: number;
  currentPoints: number;
  maxPoints: number;
  avatarUrl?: string; // Final resolved URL for display
  
  // New Avatar Fields
  avatarType: 'upload' | 'preset';
  gender: 'boy' | 'girl';
  presetId: string; // Seed for the preset API

  preferences: UserPreferences;
}

export interface Hazard {
  id: number;
  lat: number;
  lng: number;
  type: string;
  title: string;
}

export interface Report {
  id: string;
  type: 'image' | 'video';
  url: string; // Object URL for display
  timestamp: Date;
  location: { lat: number, lng: number };
  pointsEarned: number;
  status: 'Pending' | 'Verified';
}

// Backend Feed Schema Matching
export interface FeedItemData {
  id: string;
  type: 'news' | 'official' | 'reel' | 'ad';
  author: string;
  avatar: string;
  content: string;
  image?: string;
  videoUrl?: string;
  timestamp: string;
  rawTimestamp: number; // For sorting
  verified: boolean;
  likes?: number;
  severity?: 'CRITICAL' | 'MODERATE' | 'LOW'; // Backend field
  isGlobalAlert?: boolean; // Backend field
}

// Mock Data
let MOCK_POINTS = 0;
const MOCK_REPORTS: Report[] = [];

// In-memory user store for the session
let MOCK_USER: UserProfile = {
  name: 'Explorer',
  email: 'explorer@satarkx.in',
  mobile: '',
  level: 'Eco-Novice',
  levelNumber: 1,
  currentPoints: MOCK_POINTS,
  maxPoints: 100,
  avatarUrl: 'https://avatar.iran.liara.run/public/boy?username=Felix',
  avatarType: 'preset',
  gender: 'boy',
  presetId: 'Felix',
  preferences: {
    theme: 'light',
    mapStyle: 'satellite'
  }
};

export const loginUser = async (username: string, email: string): Promise<LoginResponse> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  // Update mock user with login details
  MOCK_USER.name = username;
  MOCK_USER.email = email;
  return { id: 123, username, email };
};

export const fetchUserProfile = async (): Promise<UserProfile> => {
  // Return current state of mock user
  MOCK_USER.currentPoints = MOCK_POINTS;
  return { ...MOCK_USER };
};

export const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network
  MOCK_USER = { ...MOCK_USER, ...updates };
  // Recalculate avatar URL if presets changed
  if (MOCK_USER.avatarType === 'preset') {
    MOCK_USER.avatarUrl = `https://avatar.iran.liara.run/public/${MOCK_USER.gender}?username=${MOCK_USER.presetId}`;
  }
  return { ...MOCK_USER };
};

export const fetchHazards = async (lat: number, lng: number): Promise<Hazard[]> => {
  // Generate some dummy hazards around the user's location
  const hazards = [];
  for (let i = 0; i < 5; i++) {
    hazards.push({
      id: i,
      lat: lat + (Math.random() - 0.5) * 0.01,
      lng: lng + (Math.random() - 0.5) * 0.01,
      type: 'Trash',
      title: 'Hazard Ahead'
    });
  }
  return hazards;
};

export const fetchUserReports = async (): Promise<Report[]> => {
    // Return copy of reports
    return [...MOCK_REPORTS];
};

export const submitReport = async (mediaBlob: Blob, lat: number, lng: number, mediaType: 'image' | 'video' = 'image'): Promise<{ success: boolean; points_added: number }> => {
  console.log(`Submitting ${mediaType} report...`, { lat, lng, size: mediaBlob.size });
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload time
  
  const points = mediaType === 'video' ? 20 : 10;
  MOCK_POINTS += points; // Update local mock state
  
  // Store the report in memory for the session
  const newReport: Report = {
      id: Date.now().toString(),
      type: mediaType,
      url: URL.createObjectURL(mediaBlob), // Create a viewable URL from the blob
      timestamp: new Date(),
      location: { lat, lng },
      pointsEarned: points,
      status: 'Pending'
  };
  
  // Add to beginning of list
  MOCK_REPORTS.unshift(newReport);

  return { success: true, points_added: points };
};

// --- NEW FEED ALGORITHM SIMULATION ---

export const fetchLivePulseFeed = async (lat: number, lng: number): Promise<FeedItemData[]> => {
  await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate DB latency

  // 1. Raw Data Pool (Simulating DB Collection)
  const RAW_DB: FeedItemData[] = [
    {
      id: 'alert-1',
      type: 'official', // Mapped from JUDICIARY
      severity: 'CRITICAL',
      isGlobalAlert: true,
      author: 'District Magistrate',
      avatar: 'https://ui-avatars.com/api/?name=DM&background=0f172a&color=fff',
      content: 'CRITICAL: Heavy rainfall warning issued for New Delhi District. All schools closed tomorrow.',
      timestamp: '1h ago',
      rawTimestamp: Date.now() - 3600000,
      verified: true,
    },
    {
      id: 'news-1',
      type: 'news',
      author: 'City Safety Watch',
      avatar: 'https://ui-avatars.com/api/?name=Safety+Watch&background=ef4444&color=fff',
      verified: true,
      timestamp: '10m ago',
      rawTimestamp: Date.now() - 600000,
      content: 'Traffic congestion reported on MG Road due to ongoing metro construction.',
      image: 'https://images.unsplash.com/photo-1566809835848-18e806e57a44?auto=format&fit=crop&q=80&w=800',
      likes: 124
    },
    {
      id: 'reel-1',
      type: 'reel',
      author: 'Rohan_Citizen',
      avatar: 'https://avatar.iran.liara.run/public/boy?username=Rohan',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-traffic-on-a-city-street-at-night-4261-large.mp4',
      content: 'Water logging starting near the bridge. Avoid this area guys! 🌧️ #RainUpdate',
      timestamp: '2h ago',
      rawTimestamp: Date.now() - 7200000,
      verified: false,
    },
    {
      id: 'ad-1',
      type: 'ad',
      author: 'SecureLife Insurance',
      avatar: 'https://ui-avatars.com/api/?name=SL&background=22c55e&color=fff',
      content: 'Protect your family from unexpected events. Get covered today.',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
      timestamp: 'Just now',
      rawTimestamp: Date.now(),
      verified: true,
    },
    {
      id: 'news-2',
      type: 'news',
      author: 'Local News 24',
      avatar: 'https://ui-avatars.com/api/?name=Local+News&background=f59e0b&color=fff',
      verified: true,
      timestamp: '30m ago',
      rawTimestamp: Date.now() - 1800000,
      content: 'Community cleanliness drive scheduled for this Sunday at Central Park.',
      likes: 89
    },
    {
       id: 'reel-2',
       type: 'reel',
       author: 'Priya_Reporter',
       avatar: 'https://avatar.iran.liara.run/public/girl?username=Priya',
       videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-the-water-of-a-lake-4500-large.mp4',
       content: 'View from Sector 12. Roads are clear now. ✅',
       timestamp: '4h ago',
       rawTimestamp: Date.now() - 14400000,
       verified: true,
    }
  ];

  // 2. The "Pulse" Algorithm Implementation
  
  // Filter Organic vs Ads
  const ads = RAW_DB.filter(i => i.type === 'ad');
  const organic = RAW_DB.filter(i => i.type !== 'ad');

  // Sort Organic by Weighted Score
  organic.sort((a, b) => {
    const getScore = (item: FeedItemData) => {
      let score = 0;
      // Priority 1: Critical Global Alerts
      if (item.severity === 'CRITICAL') return 1000;
      // Priority 2: Official Updates
      if (item.type === 'official') return 500;
      // Priority 3: Time Decay (Newer is better)
      score += item.rawTimestamp / 10000000000; 
      // Bonus for Video/Reels
      if (item.type === 'reel') score += 10;
      return score;
    };
    return getScore(b) - getScore(a);
  });

  // 3. Ad Injection (Mocking 1:7 ratio, here just inserting at index 3 for demo)
  if (ads.length > 0 && organic.length >= 3) {
      organic.splice(3, 0, ads[0]);
  }

  return organic;
};