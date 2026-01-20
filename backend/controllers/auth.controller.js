import { signupUser, loginUser } from "../services/auth.service.js";
export const signup = async (req, res) => {
    try {
        const result = await signupUser(req.body);

        return res.status(201).json({
            success: true,
            message: "user signed up successfully!",
            data: result
        })
    } catch (err) {
        console.log("message:", err.message)
        return res.status(200).json({
            success: false,
            message: "user could not be registered!",
            data: err.message
        })
    }
}

export const login = async (req, res) => {
    try {
        const { token, user } = await loginUser(req.body);
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,        // true in production (HTTPS)
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        return res.status(201).json({
            success: true,
            message: "user signed up successfully!",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        })
    } catch (err) {
        return res.status(200).json({
            success: false,
            message: "user could not be logged in!",
            data: err.message
        })
    }
}
