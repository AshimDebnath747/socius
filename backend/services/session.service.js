import { pool } from "../config/db.js";

export const helpRequestAccept = async (helpRequestId, helperId, mode) => {
    const query = "SELECT * FROM helprequest WHERE id = $1 AND status = 'open' ";

    const { rows } = await pool.query(query, [helpRequestId])

    if (!rows[0]) {
        throw new Error("No such help request exists!")
    }
    if (rows[0].created_by === helperId) {
        throw new Error("You cannot accept your own request");
    }

    const RequesterId = rows[0].created_by
    const time = new Date()

    console.log("mode:", mode)

    const query1 = "INSERT INTO session (help_request_id, requester_id, helper_id , mode , start_time ) VALUES ($1, $2, $3 , $4 , $5) RETURNING *;"

    const { rows: rows1 } = await pool.query(query1, [helpRequestId, RequesterId, helperId, mode, time])

    const query2 = "UPDATE helprequest SET status = 'accepted' WHERE id = $1 RETURNING *";

    const { rows: rows2 } = await pool.query(query2, [helpRequestId])

    console.log(rows1)

    return rows1[0]
}

export const getSessionById = async (id) => {

    const query = 'SELECT * FROM session WHERE id=$1';

    const { rows } = await pool.query(query, [id])

    if (!rows[0]) {
        throw new Error("Id does not match any session!")
    }

    console.log(rows)
    return rows[0]

}

export const endSessionById = async (id) => {
    const client = await pool.connect()

    console.log(typeof (id))
    try {
        await client.query("BEGIN")
        console.log("begin")
        const { rows } = await client.query("SELECT id, status, help_request_id FROM session WHERE id = $1 FOR UPDATE", [id])

        if (!rows[0]) {
            throw new Error("Session not found");
        }
        console.log("rows:", rows[0])
        const session = rows[0];

        // 2️⃣ Check current status
        if (session.status !== "active") {
            throw new Error("Only active sessions can be completed");
        }

        await client.query(`UPDATE session SET status = 'completed', end_time = CURRENT_TIMESTAMP WHERE id = $1`, [id]);

        await client.query(`UPDATE helprequest SET status = 'closed' WHERE id = $1`, [session.help_request_id]);

        await client.query("COMMIT");

        return { message: "Session completed successfully" };

    } catch (err) {
        await client.query("ROLLBACK");

        throw err
    } finally {
        client.release();
    }
}

export const cancelSessionById = async (id) => {
    const client = await pool.connect()

    try {
        await client.query("BEGIN")

        const { rows } = await client.query(`UPDATE session SET status = 'cancelled', end_time = NOW() WHERE id = $1 AND status = 'active' RETURNING help_request_id`,
            [id]
        )

        if (!rows[0]) {
            throw new Error("Session not active or does not exist")
        }

        await client.query(`UPDATE helprequest SET status = 'open' WHERE id = $1`,
            [rows[0].help_request_id]
        )

        await client.query("COMMIT")

    } catch (err) {
        await client.query("ROLLBACK")
        throw err
    } finally {
        client.release()
    }
}

export const getMessages = async (id, userId) => {
    const { rows } = await pool.query("SELECT requester_id , helper_id from session where id=$1", [id])
    if (!rows[0]) {
        throw new Error("There is no such session!")
    }

    const session = rows[0]
    if (session.requester_id !== userId && session.helper_id !== userId) {
        throw new Error("Unauthorized user!")
    }

    const { rows: messages } = await pool.query(
        `SELECT * FROM messages
     WHERE session_id=$1
     ORDER BY created_at ASC`,
        [id]
    );

    return messages
}

export const getAllSessions = async (userId) => {
    const query = `
        SELECT *
        FROM session
        WHERE requester_id = $1
           OR helper_id = $1
        ORDER BY start_time DESC;
    `;

    const { rows } = await pool.query(query, [userId]);

    return rows;
};