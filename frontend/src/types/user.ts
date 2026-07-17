export interface User {
  about: string;
  username: string;
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  headline: string;
  bio: string;
  location: string;
  website: string;
  skills: string[];
  rating: string;
  created_at: string;
}

export interface UserStats {
  total_helped: string;
  total_requested: string;
  total_reviews: string;
  average_rating: string;
  communities_joined: string;
}

export interface Community {
  id: number;
  name: string;
  slug: string;
  avatar: string | null;
  total_members: string;
}

export interface ProfileData {
  user: User;
  stats: UserStats;
  communities: Community[];
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: ProfileData;
}