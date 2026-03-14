import { pool } from "../config/db.js"
export const reviewPost = async (reviewer_id, session_id, rating, comment) => {
    const client = await pool.connect()
    try {
        await client.query("BEGIN")

        const { rows } = await client.query("SELECT requester_id , helper_id , status FROM session WHERE id=$1", [session_id])
        if (!rows[0]) {
            throw new Error("Session not found");
        }
        if (rows[0].status !== 'completed') {
            throw new Error("Can not review this session!")
        }

        if (reviewer_id !== rows[0].requester_id && reviewer_id !== rows[0].helper_id) {
            throw new Error("You are not part of this session");
        }
        let reviewed_id;

        if (rows[0].requester_id == reviewer_id) {
            reviewed_id = rows[0].helper_id
        } else {
            reviewed_id = rows[0].requester_id
        }
        const { rows: result } = await client.query(`INSERT INTO review (session_id, reviewer_id, reviewed_user_id, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *`, [session_id, reviewer_id, reviewed_id, rating, comment]);

        await client.query("COMMIT");

        return result[0]

    } catch (err) {
        await client.query("ROLLBACK")
        throw err
    } finally {
        client.release()
    }
}