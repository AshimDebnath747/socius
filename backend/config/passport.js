import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import https from "https";
import fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "..", "uploads", "avatars");

const downloadAvatar = async (imageUrl, userId, email) => {
    if (!imageUrl) return null;

    try {
        await fsPromises.mkdir(uploadDir, { recursive: true });

        const parsedUrl = new URL(imageUrl);
        const extension = path.extname(parsedUrl.pathname) || ".jpg";
        const filename = `${userId || email || "oauth"}-${Date.now()}${extension}`;
        const outputPath = path.join(uploadDir, filename);

        await new Promise((resolve, reject) => {
            const request = https.get(imageUrl, (response) => {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    response.resume();
                    resolve(downloadAvatar(response.headers.location, userId, email));
                    return;
                }

                if (response.statusCode !== 200) {
                    response.resume();
                    reject(new Error(`Failed to download avatar: ${response.statusCode}`));
                    return;
                }

                const file = fs.createWriteStream(outputPath);
                response.pipe(file);
                file.on("finish", () => file.close(resolve));
                file.on("error", reject);
            });

            request.on("error", reject);
        });

        return `/uploads/avatars/${filename}`;
    } catch (error) {
        console.error("Avatar download failed:", error.message);
        return null;
    }
};

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:8000/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            const email = profile.emails?.[0]?.value;
            const name = profile.displayName;

            if (!email) {
                return done(new Error("No email received from Google OAuth"));
            }

            const { rows } = await pool.query(
                "SELECT * FROM users WHERE email = $1",
                [email]
            );

            let user = rows[0];

            if (!user) {
                const newUser = await pool.query(
                    "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
                    [name, email]
                );
                user = newUser.rows[0];
            }

            const avatarUrl = profile.photos?.[0]?.value;
            if (avatarUrl) {
                const avatarPath = await downloadAvatar(avatarUrl, user.id, email);
                if (avatarPath) {
                    await pool.query(
                        "UPDATE users SET avatar = $1 WHERE id = $2",
                        [avatarPath, user.id]
                    );
                }
            }

            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            return done(null, { token });
        }
    )
);