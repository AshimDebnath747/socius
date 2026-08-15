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

    messageType: string;

    mediaUrl: string | null;
    mediaName: string | null;

    isRead: boolean;
    isDelivered: boolean;

    createdAt: string;
    updatedAt: string;

    name: string;
    email: string;
    avatar: string | null;
}