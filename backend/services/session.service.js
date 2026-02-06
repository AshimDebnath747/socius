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

    console.log(rows2)

    return rows2[0]
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