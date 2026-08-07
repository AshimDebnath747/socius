export interface Post {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  urgency: string;
  preferredMode: string;
  createdBy: string;
  name: string;
  avatar: string | null;
  createdAt: string;
  status: string;
  communityId: string | null;
  image: string | null;
}
export interface HelpRequestResponse {
  id: string;
  title: string;
  image: string | null
  description: string;
  category_id: string;
  urgency: "low" | "medium" | "high";
  preferred_mode: "text" | "call";
  community_id: string | null;
  created_by: string;
  name: string;
  avatar: string | null;
  created_at: string;
  status: string;
}

export interface CommunityMember {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  avatar: string;
}

export interface ChatHeaderProps {
  otherUser: {
    name: string;
    avatarUrl?: string;
    role: "requester" | "helper" | "click for more info";
    connected?: boolean;
  };
  onClick?: () => void;
}

export interface JoinRequest {
  id: number;
  communityId: number;
  userId: number;
  status: "pending" | "accepted" | "rejected";
  message: string | null;
  createdAt: string;
  name: string;
  email: string;
  avatar: string | null;
}
