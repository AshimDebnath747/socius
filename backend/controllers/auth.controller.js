import { signupUser, loginUser, checkAuthService } from "../services/auth.service.js";

const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
};
export const signup = async (req, res) => {
    try {
        const result = await signupUser(req.body);

        return res.status(200).json({
            success: true,
            message: "user signed up successfully!",
            data: result
        })
    } catch (err) {
        console.log("message on signup:", err)
        return res.status(401).json({
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
            ...cookieOptions,  // only over HTTPS
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        return res.status(200).json({
            success: true,
            message: "user signed up successfully!",
            data: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        })
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "user could not be logged in!",
            data: err.message
        })
    }
}

export const logout = (req, res) => {
    res.clearCookie("token", {
        cookieOptions
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
};

export const checkAuth = async (req, res) => {
    try {
        const token = req.cookies.token
        const result = await checkAuthService(token)
        return res.status(200).json({
            success: true,
            message: "user Authenticated successfully!",
            data: result
        })
    } catch (err) {
        return res.status(200).json({
            success: false,
            message: "user could not be authenticated in!",
            data: err.message
        })
    }
}
