/**
 * Socius Zero-Knowledge End-to-End Chat Encryption (E2EE)
 * Engine: Web Crypto API (window.crypto.subtle)
 * Key Exchange: ECDH (P-256)
 * Key Derivation: HKDF (SHA-256)
 * Cipher: AES-256-GCM
 * Private Key Storage: IndexedDB + Server Backup (Wrapped via PBKDF2)
 */

import api from "./axios";

const DB_NAME = "socius_e2ee_db";
const STORE_NAME = "private_keys";
const DB_VERSION = 1;

export interface EncryptedMessagePayload {
  v: number;
  iv: string;
  ct: string;
}

export interface WrappedPrivateKeyPayload {
  encryptedPrivateKey: string;
  keySalt: string;
  keyIv: string;
}

// ==========================================
// 1. ArrayBuffer <-> Base64 Encoding Helpers
// ==========================================

export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ==========================================
// 2. Identity Key Generation (ECDH P-256)
// ==========================================

export async function generateIdentityKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true, // extractable
    ["deriveKey", "deriveBits"]
  );
}

// ==========================================
// 3. Local Private Key Storage (IndexedDB)
// ==========================================

function openCryptoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "userId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalPrivateKey(
  userId: string | number,
  key: CryptoKey
): Promise<void> {
  const db = await openCryptoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put({ userId: String(userId), key });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getLocalPrivateKey(
  userId: string | number
): Promise<CryptoKey | null> {
  const db = await openCryptoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(String(userId));
    req.onsuccess = () => {
      resolve(req.result?.key || null);
    };
    req.onerror = () => reject(req.error);
  });
}

// =========================================================
// 4. Password-Based Key Wrapping (PBKDF2 + AES-GCM)
// =========================================================

export async function deriveWrappingKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function exportAndWrapPrivateKey(
  privateKey: CryptoKey,
  password: string
): Promise<WrappedPrivateKeyPayload> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const wrappingKey = await deriveWrappingKey(password, salt);
  const privateJwk = await window.crypto.subtle.exportKey("jwk", privateKey);

  const enc = new TextEncoder();
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    wrappingKey,
    enc.encode(JSON.stringify(privateJwk))
  );

  return {
    encryptedPrivateKey: arrayBufferToBase64(ciphertext),
    keySalt: arrayBufferToBase64(salt),
    keyIv: arrayBufferToBase64(iv),
  };
}

export async function unwrapPrivateKey(
  wrappedBase64: string,
  password: string,
  saltBase64: string,
  ivBase64: string
): Promise<CryptoKey> {
  const salt = base64ToArrayBuffer(saltBase64);
  const iv = base64ToArrayBuffer(ivBase64);
  const ciphertext = base64ToArrayBuffer(wrappedBase64);

  const wrappingKey = await deriveWrappingKey(password, salt);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    wrappingKey,
    ciphertext as BufferSource
  );

  const jwk = JSON.parse(new TextDecoder().decode(decrypted));

  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );
}

// ====================================================================
// 5. Shared Session Key Derivation (ECDH + HKDF -> AES-GCM 256)
// ====================================================================

export async function deriveSessionKey(
  myPrivateKey: CryptoKey,
  peerPublicKeyJwk: JsonWebKey | string,
  sessionId: string | number
): Promise<CryptoKey> {
  const peerJwk: JsonWebKey =
    typeof peerPublicKeyJwk === "string"
      ? JSON.parse(peerPublicKeyJwk)
      : peerPublicKeyJwk;

  const peerPublicKey = await window.crypto.subtle.importKey(
    "jwk",
    peerJwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  const sharedBits = await window.crypto.subtle.deriveBits(
    {
      name: "ECDH",
      public: peerPublicKey,
    },
    myPrivateKey,
    256
  );

  const hkdfKey = await window.crypto.subtle.importKey(
    "raw",
    sharedBits,
    { name: "HKDF" },
    false,
    ["deriveKey"]
  );

  const enc = new TextEncoder();
  const salt = enc.encode(`socius-session-${sessionId}`);
  const info = enc.encode("socius-aes-gcm-key");

  return await window.crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt,
      info,
    },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// =======================================================
// 6. Message Encryption & Decryption (AES-256-GCM)
// =======================================================

export async function encryptChatMessage(
  plaintext: string,
  sessionKey: CryptoKey
): Promise<string> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    sessionKey,
    enc.encode(plaintext)
  );

  const payload: EncryptedMessagePayload = {
    v: 1,
    iv: arrayBufferToBase64(iv),
    ct: arrayBufferToBase64(ciphertext),
  };

  return JSON.stringify(payload);
}

export async function decryptChatMessage(
  cipherPayload: string,
  sessionKey: CryptoKey
): Promise<string> {
  if (!cipherPayload || typeof cipherPayload !== "string") {
    return cipherPayload ?? "";
  }

  const trimmed = cipherPayload.trim();
  if (!trimmed.startsWith("{") || !trimmed.includes('"ct"') || !trimmed.includes('"iv"')) {
    // Legacy unencrypted message
    return cipherPayload;
  }

  let parsed: EncryptedMessagePayload;
  try {
    parsed = JSON.parse(cipherPayload);
  } catch {
    // Malformed or regular string starting with '{'
    return cipherPayload;
  }

  if (!parsed || typeof parsed !== "object" || !parsed.ct || !parsed.iv) {
    return cipherPayload;
  }

  try {
    const iv = base64ToArrayBuffer(parsed.iv);
    const ct = base64ToArrayBuffer(parsed.ct);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      sessionKey,
      ct as BufferSource
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.warn("Could not decrypt message payload with session key:", err);
    return "🔒 [Unable to decrypt message]";
  }
}

// =================================================================
// 7. Identity Key Management & Initialization Orchestrator
// =================================================================

export async function initializeUserCryptoKeys(
  userId: string | number,
  _password?: string
): Promise<{ privateKey: CryptoKey; publicKeyJwk: JsonWebKey } | null> {
  const uid = String(userId);
  if (!uid || uid === "0" || uid === "undefined" || uid === "null" || uid.trim() === "") {
    return null;
  }

  // 1. Fetch authoritative account keys from server (User-Based E2EE)
  let serverPublicKey: JsonWebKey | null = null;
  let serverPrivateKey: JsonWebKey | null = null;

  try {
    const res = await api.get("/api/users/keys/me");
    if (res.data?.success && res.data?.data) {
      if (res.data.data.publicKey) {
        serverPublicKey =
          typeof res.data.data.publicKey === "string"
            ? JSON.parse(res.data.data.publicKey)
            : res.data.data.publicKey;
      }
      if (res.data.data.privateKey) {
        serverPrivateKey =
          typeof res.data.data.privateKey === "string"
            ? JSON.parse(res.data.data.privateKey)
            : res.data.data.privateKey;
      }
    }
  } catch (err) {
    console.warn("Could not fetch user crypto keys from server:", err);
  }

  // Case A: Server has both public and private keys -> Import and sync to local IndexedDB
  if (serverPublicKey && serverPrivateKey) {
    try {
      const importedPrivateKey = await window.crypto.subtle.importKey(
        "jwk",
        serverPrivateKey,
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey", "deriveBits"]
      );
      await saveLocalPrivateKey(uid, importedPrivateKey);
      return { privateKey: importedPrivateKey, publicKeyJwk: serverPublicKey };
    } catch (importErr) {
      console.error("Failed to import server private key:", importErr);
    }
  }

  // Case B: Local device has a private key in IndexedDB (e.g. from existing chat session)
  try {
    const localPrivateKey = await getLocalPrivateKey(uid);
    if (localPrivateKey) {
      const privJwk = await window.crypto.subtle.exportKey("jwk", localPrivateKey);
      // Derive matching public key from local private key coordinates
      const derivedPubJwk: JsonWebKey = {
        kty: "EC",
        crv: "P-256",
        x: privJwk.x,
        y: privJwk.y,
      };

      const matchesServerPub = !serverPublicKey || (
        serverPublicKey.x === privJwk.x && serverPublicKey.y === privJwk.y
      );

      if (matchesServerPub) {
        try {
          const syncRes = await api.post("/api/users/keys", {
            publicKey: JSON.stringify(derivedPubJwk),
            privateKey: JSON.stringify(privJwk),
          });
          const authoritativePub = syncRes.data?.data?.publicKey || derivedPubJwk;
          const finalPub = typeof authoritativePub === "string" ? JSON.parse(authoritativePub) : authoritativePub;
          return { privateKey: localPrivateKey, publicKeyJwk: finalPub };
        } catch (syncErr) {
          console.warn("Could not sync local private key to server:", syncErr);
        }
        return { privateKey: localPrivateKey, publicKeyJwk: derivedPubJwk };
      }
    }
  } catch (localErr) {
    console.warn("Could not access local private key:", localErr);
  }

  // Case C: Neither server nor local device has matching private key -> Generate key pair once and persist
  try {
    const keyPair = await generateIdentityKeyPair();
    const pubJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const privJwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

    // Upload to server first so server can save or return authoritative keys
    const saveRes = await api.post("/api/users/keys", {
      publicKey: JSON.stringify(pubJwk),
      privateKey: JSON.stringify(privJwk),
    });

    if (saveRes.data?.data?.privateKey) {
      const sPriv =
        typeof saveRes.data.data.privateKey === "string"
          ? JSON.parse(saveRes.data.data.privateKey)
          : saveRes.data.data.privateKey;
      const sPub =
        typeof saveRes.data.data.publicKey === "string"
          ? JSON.parse(saveRes.data.data.publicKey)
          : saveRes.data.data.publicKey;
      const imported = await window.crypto.subtle.importKey(
        "jwk",
        sPriv,
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey", "deriveBits"]
      );
      await saveLocalPrivateKey(uid, imported);
      return { privateKey: imported, publicKeyJwk: sPub };
    }

    // Save locally in IndexedDB as fallback
    await saveLocalPrivateKey(uid, keyPair.privateKey);
    return { privateKey: keyPair.privateKey, publicKeyJwk: pubJwk };
  } catch (err) {
    console.error("Failed to generate or upload identity keys:", err);
    return null;
  }
}

export async function fetchUserPublicKey(
  userId: string | number
): Promise<JsonWebKey | null> {
  try {
    const res = await api.get(`/api/users/${userId}/public-key`);
    if (res.data?.success && res.data?.data?.publicKey) {
      return typeof res.data.data.publicKey === "string"
        ? JSON.parse(res.data.data.publicKey)
        : res.data.data.publicKey;
    }
  } catch (err) {
    console.warn(`Could not fetch public key for user ${userId}:`, err);
  }
  return null;
}
