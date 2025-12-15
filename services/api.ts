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