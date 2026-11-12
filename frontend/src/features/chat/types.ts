export type MessageType = "text" | "image" | "video" | "file" | "call";

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
    isEncrypted?: boolean;
    createdAt: string;
}

export interface ChatUser {
    id: string;
    name: string;
    avatarUrl?: string;
    role: "requester" | "helper";
}