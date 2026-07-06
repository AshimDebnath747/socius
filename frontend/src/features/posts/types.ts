export interface Post {
    id: number;
    title: string;
    description: string;
    categoryId: number;
    urgency: string;
    preferredMode: string;
    createdBy: number;
    name: string,
    createdAt: string;
    status: string;
    communityId: number | null | undefined;
}
export interface HelpRequestResponse {
    id: number;
    title: string;
    description: string;
    category_id: number;
    urgency: "low" | "medium" | "high";
    preferred_mode: "text" | "call";
    community_id: number | null;
    created_by: number;
    name: string;
    created_at: string;
    status: string;
}