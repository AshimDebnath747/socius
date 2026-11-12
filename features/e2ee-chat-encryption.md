# Zero-Knowledge End-to-End Chat Encryption (E2EE) in Socius

## 1. Overview
In Socius, 1-on-1 help sessions feature a real-time and historical chat system. This feature implements **Zero-Knowledge Client-Side End-to-End Encryption (E2EE)** such that:
1. All message contents are encrypted on the sender's client before hitting the network or backend.
2. The database and backend only ever store and relay opaque ciphertext. No backend developer, administrator, or compromised server can read the chat text.
3. Only authenticated participants of the session can decrypt and view the original plaintext on their client.
4. Legacy unencrypted messages are handled gracefully without crashing the UI.

---

## 2. Cryptographic Architecture

```
                      ┌─────────────────────────────────────────────────────────────┐
                      │                     SENDER CLIENT                           │
                      │                                                             │
                      │ 1. Local Private Key (IndexedDB: ECDH P-256)                │
                      │ 2. Fetch Recipient Public Key (/api/users/:id/public-key)    │
                      │ 3. ECDH Bits Derivation + HKDF (SHA-256)                    │
                      │    salt: "socius-session-<id>", info: "socius-aes-gcm-key"   │
                      │ 4. AES-256-GCM Encrypt with fresh random 12-byte IV         │
                      └──────────────────────────────┬──────────────────────────────┘
                                                     │
                                                     ▼
                               Payload: { "v": 1, "iv": "...", "ct": "..." }
                                                     │
                      ┌──────────────────────────────┴──────────────────────────────┐
                      │               BACKEND & NEON POSTGRESQL DB                  │
                      │                                                             │
                      │ • DB stores ONLY opaque ciphertext string in messages       │
                      │ • Socket relays ciphertext without ability to inspect text  │
                      │ • Background notification preview sanitized to:             │
                      │   "🔒 New encrypted message" or "🔒 Sent a media file"     │
                      └──────────────────────────────┬──────────────────────────────┘
                                                     │
                                                     ▼
                      ┌──────────────────────────────┴──────────────────────────────┐
                      │                    RECIPIENT CLIENT                         │
                      │                                                             │
                      │ 1. Local Private Key (IndexedDB: ECDH P-256)                │
                      │ 2. Peer Public Key                                          │
                      │ 3. Identical Shared AES-256-GCM Session Key Derivation      │
                      │ 4. Decrypt AES-GCM (iv + ct) -> Plaintext in React State    │
                      │ 5. Legacy unencrypted messages pass through gracefully      │
                      └─────────────────────────────────────────────────────────────┘
```

- **Engine**: Native Web Crypto API (`window.crypto.subtle`) — zero external cryptographic dependencies.
- **Key Exchange**: ECDH (Elliptic Curve Diffie-Hellman) over NIST curve `P-256`.
- **Key Derivation**: HKDF (`SHA-256`, `salt = "socius-session-" + sessionId`, `info = "socius-aes-gcm-key"`).
- **Message Cipher**: AES-256-GCM with a fresh random 96-bit (12-byte) IV for every message. Payload format: `JSON.stringify({ v: 1, iv: toBase64(iv), ct: toBase64(ciphertext) })`.
- **Private Key Storage**: Browser `IndexedDB` (primary) and an encrypted private key backup stored on the server wrapped with a PBKDF2-derived key (from the user password, 100,000 iterations of SHA-256, AES-256-GCM) for cross-device synchronization.

---

## 3. Implementation Details by Phase

### Phase 1: Database Schema Updates
- **Table**: `user_crypto_keys` created in PostgreSQL on Neon:
  ```sql
  CREATE TABLE IF NOT EXISTS user_crypto_keys (
      user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      public_key TEXT NOT NULL,          -- JSON-stringified JWK or Base64 SPKI
      encrypted_private_key TEXT,        -- Base64 ciphertext of private key (wrapped via PBKDF2)
      key_salt TEXT,                     -- Salt used for PBKDF2 key derivation
      key_iv TEXT,                       -- IV used for AES-GCM private key encryption
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  ```
- **Migration Script**: Stored in `backend/migrations/001_create_user_crypto_keys.sql`.
- **Message Content**: Verified `messages.content` is column type `TEXT` to accommodate opaque JSON ciphertext strings.

---

### Phase 2: Client-Side Cryptographic Library
Dedicated WebCrypto module created at `frontend/src/lib/crypto.ts`:
- **Key Generation**: `generateIdentityKeyPair()` generates ECDH keypairs over curve `P-256` (`extractable: true`, usages `["deriveKey", "deriveBits"]`).
- **IndexedDB Storage**: `saveLocalPrivateKey()` and `getLocalPrivateKey()` persist `CryptoKey` objects directly in `socius_e2ee_db`.
- **Password Wrapping (PBKDF2)**:
  - `deriveWrappingKey()` uses 100,000 iterations of `PBKDF2-SHA256` to derive an AES-256-GCM wrapping key.
  - `exportAndWrapPrivateKey()` wraps the exported JWK private key with a random 16-byte salt and 12-byte IV for multi-device synchronization.
  - `unwrapPrivateKey()` recovers the ECDH private key upon login with password.
- **Session Key Derivation**:
  - `deriveSessionKey()` imports peer public key JWK, derives 256 bits via ECDH, and feeds into HKDF (`SHA-256`, `salt = "socius-session-" + sessionId`, `info = "socius-aes-gcm-key"`) to produce a symmetric AES-256-GCM session key.
- **Message Cipher**:
  - `encryptChatMessage()` generates a fresh 12-byte IV for every message and outputs `JSON.stringify({ v: 1, iv, ct })`.
  - `decryptChatMessage()` decrypts valid payloads, returns legacy messages as-is, and returns `"🔒 [Unable to decrypt message]"` on key mismatch.

---

### Phase 3: Backend Key Management Endpoints
- **Service Layer (`backend/services/user.service.js`)**:
  - `upsertUserCryptoKeys(userId, publicKey, encryptedPrivateKey, keySalt, keyIv)`
  - `getUserPublicKey(userId)`
  - `getUserCryptoKeys(userId)`
- **Controller Layer (`backend/controllers/user.controller.js`)**:
  - `saveUserCryptoKeysController` (`POST /api/users/keys`)
  - `getUserPublicKeyController` (`GET /api/users/:id/public-key`)
  - `getMyCryptoKeysController` (`GET /api/users/keys/me`)
- **Route Mounting**: Configured in `backend/routes/user.route.js` and mounted under both `/api/user` and `/api/users` in `backend/index.js`.

---

### Phase 4: Frontend Auth & Key Initialization
- **Login (`frontend/src/features/auth/pages/LoginPage.tsx`)**:
  Automatically derives/restores private key using entered password or creates fresh keys upon successful sign-in.
- **Signup (`frontend/src/features/auth/pages/RegisterPage.tsx`)**:
  Provisions initial identity keys and saves password-wrapped backup on the server.
- **Session Restore (`frontend/src/app/App.tsx`)**:
  Ensures local private keys exist in IndexedDB upon authentication check on app load.

---

### Phase 5 & 6: Chat Transmission & Decryption
- **Session Derivation (`frontend/src/features/chat/ChatPage.tsx`)**:
  Derives AES-256-GCM session key when a conversation is opened using current user's private key and peer's public key.
- **Encrypted Sending**:
  - Text messages: Encrypted with `encryptChatMessage(content, sessionKey)` prior to `socket.emit("send-message")`.
  - Media captions: Encrypted prior to socket emit.
- **Real-Time Decryption**: In `socket.on("receive-message")`, decrypts incoming ciphertext with `decryptChatMessage` before appending to state.
- **History Decryption**: Decrypts historical messages fetched from `/api/sessions/:id/messages`.
- **Notification Sanitization (`backend/sockets/message.socket.js`)**:
  Emits `"🔒 New encrypted message"` or `"🔒 Sent a media file"` to background users, preventing ciphertext leaks in previews.
- **UI Indicator**: Added green `E2EE` badge with lock icon in the chat header to indicate active end-to-end encryption.

---

## 4. Verification & Security Audit Results

| Check | Test Performed | Result |
| :--- | :--- | :--- |
| **Database Schema** | Queried `information_schema.columns` for `user_crypto_keys` | **Verified** (all columns and types active) |
| **Backend Services** | Tested upsert and retrieval of public & wrapped keys | **Passed** |
| **WebCrypto Pipeline** | Alice & Bob key exchange, derivation, AES-256-GCM encrypt/decrypt | **Passed** (`Decrypted text match: true`) |
| **Attacker Rejection** | Third-party (Eve) key attempting to decrypt session message | **Blocked** (`"🔒 [Unable to decrypt message]"`) |
| **Legacy Backward Compatibility** | Decrypting raw unencrypted plaintext message | **Passed** (returned original text without crashing) |
| **Cross-Device Recovery** | PBKDF2 wrap -> unwrap with password -> derive session key | **Verified** (`Cross-device restored key: true`) |
| **Linter** | `npm --prefix frontend run lint` | **Passed** (0 errors, exit code 0) |
| **TypeScript / Build** | `tsc -b && vite build` | **Passed** (Clean production build) |
