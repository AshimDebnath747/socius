export type MessageType = "text" | "image" | "video" | "file";

export interface Message {
    id: string;
    sessionId: string;
    senderId: string;

    content: string;

    messageType: MessageType;

    mediaUrl?: string;
    mediaName?: string;
    mediaMimeType?: string;
    mediaSize?: number;

    isRead: boolean;
    isDelivered: boolean;
    createdAt: string;
}

export interface ChatUser {
    id: string;
    name: string;
    avatarUrl?: string;
    role: "requester" | "helper";
}