import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  getUserById,
  putUser,
  getReviewsById,
  getNextUserById,
  updateAvatarService,
  upsertUserCryptoKeys,
  getUserPublicKey,
  getUserCryptoKeys,
  encryptPrivateKeyAtRest,
  decryptPrivateKeyAtRest,
} from "../services/user.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads", "avatars");

export const getUserByIdController = async (req, res) => {
  const userId = req.params.id ?? req.user.id
  try {
    const result = await getUserById(userId);

    return res.status(201).json({
      success: true,
      message: "user fetched successfully",
      data: result
    })
  } catch (err) {
    console.log("message:", err.message)
    return res.status(200).json({
      success: false,
      message: "user could not be fetched!",
      data: err.message
    })
  }
}

export const putUserController = async (req, res) => {
  try {
    const {
      name,
      headline,
      bio,
      about,
      location,
      website,
      skills,
    } = req.body;

    const id = req.user.id;

    const result = await putUser(
      id,
      name,
      headline,
      bio,
      about,
      location,
      website,
      skills
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: result,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getReviewsByIdController = async (req, res) => {

  try {
    const id = req.params.id
    const { page, limit } = req.validatedQuery

    const result = await getReviewsById(id, page, limit)
    return res.status(201).json({
      success: true,
      message: "user updated successfully",
      data: result
    })


  } catch (err) {
    console.log("message:", err.message)
    return res.status(200).json({
      success: false,
      message: "user could not be updated!",
      data: err.message
    })
  }
}

// Get user by id for next user to chat.

export const getNextUserByIdController = async (req, res) => {
  const helperId = req.query.helperid
  const requesterId = req.query.requesterid
  const currentUserId = req.user?.id;

  console.log("helper id", helperId)
  console.log("requester id", requesterId)

  if (helperId == null || requesterId == null) {
    return res.status(400).json({
      success: false,
      message: "helper_id and requester_id are required",
    });
  }

  try {
    const result = await getNextUserById(helperId, requesterId, currentUserId);

    return res.status(200).json({
      success: true,
      message: "user fetched successfully",
      data: result
    });
  } catch (err) {
    console.log("message:", err.message);
    return res.status(400).json({
      success: false,
      message: "user could not be fetched!",
      data: err.message
    });
  }
}

export const updateAvatarController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image.",
      });
    }

    const userId = req.user.id;
    const avatar = `/uploads/avatars/${req.file.filename}`;

    const currentUser = await getUserById(userId);
    const previousAvatar = currentUser?.user?.avatar;

    if (previousAvatar && previousAvatar.startsWith("/uploads/avatars/")) {
      const previousFileName = path.basename(previousAvatar);
      const previousFilePath = path.join(uploadsDir, previousFileName);

      try {
        await fs.promises.access(previousFilePath);
        await fs.promises.unlink(previousFilePath);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error("Failed to remove previous avatar:", error.message);
        }
      }
    }

    const updatedUser = await updateAvatarService(userId, avatar);

    return res.status(200).json({
      success: true,
      message: "Avatar updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const saveUserCryptoKeysController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { publicKey, privateKey, encryptedPrivateKey, keySalt, keyIv } = req.body;

    if (!publicKey && !privateKey) {
      return res.status(400).json({
        success: false,
        message: "Public key or private key is required",
      });
    }

    // Check if user ALREADY has valid decryptable keys stored
    const existing = await getUserCryptoKeys(userId);
    if (existing && existing.encrypted_private_key) {
      const existingDecrypted = decryptPrivateKeyAtRest(existing.encrypted_private_key);
      if (existingDecrypted) {
        let existingPrivObj = null;
        try {
          existingPrivObj = JSON.parse(existingDecrypted);
        } catch {
          existingPrivObj = existingDecrypted;
        }

        let existingPubObj = null;
        try {
          existingPubObj = typeof existing.public_key === "string" ? JSON.parse(existing.public_key) : existing.public_key;
        } catch {
          existingPubObj = existing.public_key;
        }

        // Return existing authoritative keys without overwriting!
        return res.status(200).json({
          success: true,
          message: "Keys already exist for user",
          data: {
            userId: existing.user_id,
            publicKey: existingPubObj,
            privateKey: existingPrivObj,
          },
        });
      }
    }

    // Server does not have valid decryptable keys yet.
    // Encrypt private key at rest if provided, and guarantee matching public key coordinates.
    let finalEncryptedPrivate = encryptedPrivateKey ?? null;
    let finalPublicKey = publicKey;

    if (privateKey) {
      const privObj = typeof privateKey === "object" ? privateKey : JSON.parse(privateKey);
      finalEncryptedPrivate = encryptPrivateKeyAtRest(JSON.stringify(privObj));

      if (privObj && privObj.x && privObj.y) {
        finalPublicKey = {
          kty: "EC",
          crv: "P-256",
          x: privObj.x,
          y: privObj.y,
        };
      }
    }

    const pubStr = typeof finalPublicKey === "object" ? JSON.stringify(finalPublicKey) : finalPublicKey;

    const savedKeys = await upsertUserCryptoKeys(
      userId,
      pubStr,
      finalEncryptedPrivate,
      keySalt ?? null,
      keyIv ?? null
    );

    let returnPrivateKey = null;
    if (privateKey) {
      returnPrivateKey = typeof privateKey === "object" ? privateKey : JSON.parse(privateKey);
    } else if (savedKeys?.encrypted_private_key) {
      const decrypted = decryptPrivateKeyAtRest(savedKeys.encrypted_private_key);
      returnPrivateKey = decrypted ? JSON.parse(decrypted) : null;
    }

    let returnPublicKey = null;
    try {
      returnPublicKey = typeof savedKeys?.public_key === "string" ? JSON.parse(savedKeys.public_key) : savedKeys?.public_key;
    } catch {
      returnPublicKey = savedKeys?.public_key;
    }

    return res.status(200).json({
      success: true,
      message: "Crypto keys saved successfully",
      data: {
        userId: savedKeys?.user_id || userId,
        publicKey: returnPublicKey,
        privateKey: returnPrivateKey,
      },
    });
  } catch (err) {
    console.error("Error saving crypto keys:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to save crypto keys",
      error: err.message,
    });
  }
};

export const getUserPublicKeyController = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const keyData = await getUserPublicKey(targetUserId);

    if (!keyData || !keyData.public_key) {
      return res.status(404).json({
        success: false,
        message: "Public key not found for user",
      });
    }

    let publicKeyJwk = null;
    try {
      publicKeyJwk = typeof keyData.public_key === "string" ? JSON.parse(keyData.public_key) : keyData.public_key;
    } catch {
      publicKeyJwk = keyData.public_key;
    }

    return res.status(200).json({
      success: true,
      data: {
        userId: keyData.user_id,
        publicKey: publicKeyJwk,
      },
    });
  } catch (err) {
    console.error("Error fetching public key:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch public key",
      error: err.message,
    });
  }
};

export const getMyCryptoKeysController = async (req, res) => {
  try {
    const userId = req.user.id;
    const keyData = await getUserCryptoKeys(userId);

    if (!keyData) {
      return res.status(404).json({
        success: false,
        message: "No keys found for current user",
        data: null,
      });
    }

    let privateKeyJwk = null;
    if (keyData.encrypted_private_key) {
      const decrypted = decryptPrivateKeyAtRest(keyData.encrypted_private_key);
      if (decrypted) {
        try {
          privateKeyJwk = JSON.parse(decrypted);
        } catch {
          privateKeyJwk = decrypted;
        }
      }
    }

    let publicKeyJwk = null;
    if (keyData.public_key) {
      try {
        publicKeyJwk = typeof keyData.public_key === "string" ? JSON.parse(keyData.public_key) : keyData.public_key;
      } catch {
        publicKeyJwk = keyData.public_key;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        userId: keyData.user_id,
        publicKey: publicKeyJwk,
        privateKey: privateKeyJwk,
        encryptedPrivateKey: keyData.encrypted_private_key,
        keySalt: keyData.key_salt,
        keyIv: keyData.key_iv,
      },
    });
  } catch (err) {
    console.error("Error fetching user crypto keys:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user crypto keys",
      error: err.message,
    });
  }
};