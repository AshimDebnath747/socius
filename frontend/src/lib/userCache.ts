import type { Session } from "../types/session";

export interface CachedUserProfile {
  id: string | number;
  name: string;
  avatarUrl?: string | null;
  avatar?: string | null;
  role?: "requester" | "helper";
}

const CACHE_USER_PREFIX = "socius_user_profile_";
const CACHE_SESSION_PEER_PREFIX = "socius_session_peer_";
const SESSIONS_CACHE_KEY = "socius_cached_sessions";

export const getStoredUserId = (): string => {
  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      return String(parsed.id || parsed.userId || "");
    }
  } catch (err) {
    console.warn("Failed to parse stored user from localStorage:", err);
  }
  return "";
};

export const getCachedUserProfile = (userId: string | number): CachedUserProfile | null => {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${CACHE_USER_PREFIX}${userId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setCachedUserProfile = (user: CachedUserProfile): void => {
  if (!user || !user.id) return;
  try {
    localStorage.setItem(`${CACHE_USER_PREFIX}${user.id}`, JSON.stringify(user));
  } catch (err) {
    console.warn("Failed to cache user profile in localStorage:", err);
  }
};

export const getCachedSessionPeer = (sessionId: string | number): CachedUserProfile | null => {
  if (!sessionId) return null;
  try {
    const raw = localStorage.getItem(`${CACHE_SESSION_PEER_PREFIX}${sessionId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setCachedSessionPeer = (sessionId: string | number, user: CachedUserProfile): void => {
  if (!sessionId || !user) return;
  try {
    localStorage.setItem(`${CACHE_SESSION_PEER_PREFIX}${sessionId}`, JSON.stringify(user));
    if (user.id) {
      localStorage.setItem(`${CACHE_USER_PREFIX}${user.id}`, JSON.stringify(user));
    }
  } catch (err) {
    console.warn("Failed to cache session peer in localStorage:", err);
  }
};

export const cacheSessionsPeers = (sessions: Session[], currentUserId?: string | number): void => {
  const myId = String(currentUserId || getStoredUserId() || "");
  if (!Array.isArray(sessions)) return;

  try {
    sessions.forEach((s) => {
      if (!s) return;
      const targetId = String(myId) === String(s.requester_id) ? s.helper_id : s.requester_id;
      const role = String(myId) === String(s.requester_id) ? "helper" : "requester";
      if (s.peer_name) {
        const profile: CachedUserProfile = {
          id: targetId,
          name: s.peer_name,
          avatarUrl: s.peer_avatar || null,
          avatar: s.peer_avatar || null,
          role,
        };
        setCachedSessionPeer(s.id, profile);
      }
    });
  } catch (err) {
    console.warn("Failed to batch cache session peers:", err);
  }
};

export const getCachedSessions = (): Session[] | null => {
  try {
    const raw = localStorage.getItem(SESSIONS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const setCachedSessions = (sessions: Session[]): void => {
  if (!Array.isArray(sessions)) return;
  try {
    localStorage.setItem(SESSIONS_CACHE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.warn("Failed to cache sessions list in localStorage:", err);
  }
};

export const clearAllUserCaches = (): void => {
  try {
    localStorage.removeItem(SESSIONS_CACHE_KEY);
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith(CACHE_USER_PREFIX) ||
        key.startsWith(CACHE_SESSION_PEER_PREFIX)
      ) {
        localStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.warn("Failed to clear user caches from localStorage:", err);
  }
};
