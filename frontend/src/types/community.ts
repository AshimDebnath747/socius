export interface Community {
    avatar: string;
    id: number;
    name: string;
    slug: string;
    description: string;
    rules: string;
    isPrivate: boolean;
    createdAt: string;
}

export interface CommunityMessage {
    id: string;

    sessionId: string | null;
    communityId: string | null;

    senderId: string;

    content: string;

    isRead: boolean;
    isDelivered: boolean;

    createdAt: string;
    updatedAt: string;

    // Sender Info
    name: string;
    email: string;
    avatar: string | null;
}