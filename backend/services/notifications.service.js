import { pool } from "../config/db.js";

export const getAllNotifications = async (userId) => {

    const { rows } = await pool.query("SELECT * FROM notification WHERE user_id = $1 ORDER BY created_at DESC", [userId])

    console.log(rows)
    return rows
}

export const readMessageById = async (mId, userId) => {

    const { rows } = await pool.query("UPDATE notification SET is_read = TRUE WHERE id=$1 and user_id = $2 RETURNING *", [mId, userId])

    if (!rows[0]) {
        throw new Error("There is no such notification!")
    }

    console.log(rows)

    return rows[0]
}

export const readAllMessage = async (req, res) => {

    const { rows } = await pool.query("UPDATE notification SET is_read = TRUE WHERE user_id=$1 and is_read=FALSE returning *", [userId])

    if (!rows[0]) {
        throw new Error("No unread notifications!")
    }

    console.log(rows)

    return rows


}