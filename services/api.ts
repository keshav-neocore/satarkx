// This service handles communication with the backend.

export interface LoginResponse {
  id: number;
  [key: string]: any;
}

export interface UserProfile {
  name: string;
  level: string;
  levelNumber: number;
  currentPoints: number;
  maxPoints: number;
  avatarUrl?: string;
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

export const loginUser = async (username: string, email: string): Promise<LoginResponse> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  // Mock success
  return { id: 123, username, email };
};

export const fetchUserProfile = async (): Promise<UserProfile> => {
  // Simulate API call
  return {
    name: 'Explorer',
    level: 'Eco-Novice',
    levelNumber: 1,
    currentPoints: MOCK_POINTS,
    maxPoints: 100,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
  };
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