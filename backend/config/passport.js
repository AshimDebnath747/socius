import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js"

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:8000/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            const email = profile.emails[0].value;
            const name = profile.displayName;

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

            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            return done(null, { token });
        }
    )
);