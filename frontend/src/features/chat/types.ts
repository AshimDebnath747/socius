export interface Message {
    id: string;
    sessionId: string;
    senderId: string;
    content: string;
    isRead: boolean;
    isDelivered: boolean;
    createdAt: string; // ISO timestamp
}

export interface ChatUser {
    id: string;
    name: string;
    avatarUrl?: string;
    role: "requester" | "helper";
}