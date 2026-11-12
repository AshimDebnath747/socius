-- Migration: Create user_crypto_keys table for E2EE
CREATE TABLE IF NOT EXISTS user_crypto_keys (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,          -- JSON-stringified JWK or Base64 SPKI
    encrypted_private_key TEXT,        -- Base64 ciphertext of private key (wrapped via PBKDF2)
    key_salt TEXT,                     -- Salt used for PBKDF2 key derivation
    key_iv TEXT,                       -- IV used for AES-GCM private key encryption
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
