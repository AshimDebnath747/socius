export interface Post {
    id: string;
    title: string;
    description: string;
    categoryId: string;
    urgency: string;
    preferredMode: string;
    createdBy: string;
    name: string,
    createdAt: string;
    status: string;
    communityId: string | null;
}
export interface HelpRequestResponse {
    id: string;
    title: string;
    description: string;
    category_id: string;
    urgency: "low" | "medium" | "high";
    preferred_mode: "text" | "call";
    community_id: string | null;
    created_by: string;
    name: string;
    created_at: string;
    status: string;
}

export interface CommunityMember {
    id: string;
    name: string;
    email: string;
    role: string;
    joinedAt: string;
    profilePicture?: string;
}