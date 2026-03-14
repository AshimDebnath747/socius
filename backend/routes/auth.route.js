import express from 'express';
import { validate } from '../middlewares/validate.middleware.js';
import { loginSchema, signupSchema } from '../validators/auth.validator.js';
import { login, signup } from '../controllers/auth.controller.js';
import passport from 'passport';
const router = express.Router()

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.get(
    "/google-auth",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
    "/google/callback",
    passport.authenticate("google", { session: false }),
    (req, res) => {
        const token = req.user.token;

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.redirect(`http://localhost:5173/`);
    }
);

export default router;