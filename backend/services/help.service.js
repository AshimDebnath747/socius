import { pool } from "../config/db.js"

export const postHelpRequest = async (title, description, category, urgency, preferredMode, communityId, userId) => {
    if (communityId != null) {
        const query1 = "SELECT 1 FROM communitymember WHERE community_id = $1 AND user_id = $2";

        const { rows: rows1 } = await pool.query(query1, [communityId, userId])

        if (!rows1[0]) {
            throw new Error("You are not a part of this communinty!")
        }
    }
    const query = 'INSERT INTO helprequest (title , description , category , urgency , preferred_mode , created_by , community_id) VALUES ($1 , $2 , $3 , $4 , $5 , $6 , $7) RETURNING *';

    const { rows } = await pool.query(query, [title, description, category, urgency, preferredMode, userId, communityId])

    return rows

}

export const getHelpRequest = async (communityId, status) => {

    if (!communityId) {
        const query = 'SELECT * FROM helprequest WHERE community_id IS NULL and status = $1 ORDER BY created_at DESC';

        const { rows } = await pool.query(query, [status])
        return rows

    } else {
        const query = 'SELECT * FROM helprequest WHERE community_id = $1 and status = $2 ORDER BY created_at DESC';

        const { rows } = await pool.query(query, [communityId, status])

        return rows
    }

}

export const getHelpRequestById = async (id) => {

    //I think this function needs improvements but I don't have anything in mind rn .. will think in future

    const query = 'SELECT * FROM helprequest WHERE id = $1';

    const { rows } = await pool.query(query, [id])

    if (!rows[0]) {
        throw new Error("There might be some problem in server!")
    }

    return rows[0]

}

export const closeHelpRequest = async (id) => {
    const query = 'UPDATE helprequest SET status = $1 WHERE id = $2 RETURNING *'

    const { rows } = await pool.query(query, ['closed', id])

    if (!rows[0]) {
        throw new Error("The help Request id is not valid!")
    }

    console.log(rows)

    return rows[0]
}