import { pool } from "../config/db.js";

export const getAllNotifications = async (userId) => {

    const { rows } = await pool.query("SELECT * FROM notification WHERE user_id = $1 ORDER BY created_at DESC", [userId])

    return rows
}