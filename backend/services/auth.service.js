import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

//user signup service
export const signupUser = async ({ name, email, password }) => {
    const { rows: existingUser } = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
    );

    if (existingUser.length > 0) {
        throw new Error("User already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
        "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id",
        [name, email, hashedPassword]
    );
    return {
        id: rows[0].id,
        name,
        email
    };
}


//user login service
export const loginUser = async ({ email, password }) => {
    const { rows } = await pool.query(
        "SELECT id,name,email,password FROM users WHERE email = $1",
        [email]
    );
    if (rows.length === 0) {
        throw new Error("Invalid credentials");
    }

    const user = rows[0];

    // ✅ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error("Invalid credentials");
    }

    // ✅ Generate JWT
    const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    };
}