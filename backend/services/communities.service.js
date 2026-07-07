import { pool } from '../config/db.js';
import { slugify } from '../utils/slugify.js';

async function generateUniqueSlug(name) {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const { rowCount } = await pool.query(
            "SELECT 1 FROM community WHERE slug = $1",
            [slug]
        );

        if (rowCount === 0) break;
        slug = `${baseSlug}-${counter++}`;
    }

    return slug;
}


export const createCommunity = async (name, description, rules, is_private, userid, time) => {
    const slug = await generateUniqueSlug(name)
    const query = `INSERT INTO community (name ,slug , description , rules , is_private) VALUES ($1 , $2 , $3 , $4 ,$5) RETURNING id`;

    const { rows: rows } = await pool.query(query, [name, slug, description, rules, is_private]);
    const communityId = rows[0].id
    const query2 = `INSERT INTO communitymember (community_id , user_id , role , joined_at) VALUES ($1 , $2 , $3 , $4) RETURNING id`;
    const { rows: rows2 } = await pool.query(query2, [communityId, userid, "owner", time]);
    return rows2[0];

}

export const getCommunities = async (userId) => {
    const query = `
    SELECT c.*
FROM community c
INNER JOIN communitymember cm
ON c.id = cm.community_id
WHERE cm.user_id = $1;`
    const { rows } = await pool.query(query, [userId])
    return rows
}

export const getCommunityById = async (id) => {
    const query = 'SELECT * FROM community WHERE id=$1';
    const { rows } = await pool.query(query, [id])
    if (!rows[0]) {
        throw new Error("no such community id!")

    }
    return rows[0]
}

export const joinCommunity = async (communityId, userId, time) => {

    const query1 = 'SELECT * FROM communitymember WHERE community_id = $1 and user_id = $2';
    const { rows: rows1 } = await pool.query(query1, [communityId, userId])
    console.log("join", rows1)
    if (rows1[0]) {
        throw new Error("this user is already in this community")
    }

    const query2 = 'SELECT * FROM community WHERE id = $1';
    const { rows: rows2 } = await pool.query(query2, [communityId])
    if (!rows2[0]) {
        throw new Error("this community does not exist")
    }

    const query3 = 'SELECT * FROM users WHERE id = $1';
    const { rows: rows3 } = await pool.query(query3, [userId])
    if (!rows3[0]) {
        throw new Error("this user does not exist")
    }


    const query = 'INSERT INTO communitymember (community_id , user_id , role , joined_at) VALUES ($1 , $2 , $3 , $4) RETURNING *';
    const { rows } = await pool.query(query, [communityId, userId, "member", time])
    return rows
}

export const leaveCommunity = async (communityId, userId) => {
    const query1 = 'SELECT * FROM communitymember WHERE community_id = $1 and user_id = $2';
    const { rows: rows1 } = await pool.query(query1, [communityId, userId])

    if (!rows1[0]) {
        throw new Error("this user does not exist in this community")
    }
    const query = 'DELETE FROM communitymember where community_id = $1 and user_id = $2';
    const { rows } = await pool.query(query, [communityId, userId])
    return rows
}

export const getAllCommunityMembers = async (communityId) => {
    const query1 = 'SELECT id from community where id = $1';

    const { rows: rows1 } = await pool.query(query1, [communityId])

    if (!rows1[0]) {
        throw new Error("There is no such community!")
    }

    const query = 'SELECT u.id , u.name , u.email , cm.role , cm.joined_at FROM communitymember cm JOIN users u ON u.id = cm.user_id WHERE cm.community_id = $1'

    const { rows } = await pool.query(query, [communityId])

    console.log(rows)
    return rows
}

export const changeRole = async (AdminId, role, communityId, userId) => {

    if (!['member', 'moderator'].includes(role)) {
        throw new Error("role not valid!")
    }
    const query1 = 'SELECT role FROM communitymember WHERE community_id = $1 and user_id = $2'

    const { rows: rows1 } = await pool.query(query1, [communityId, AdminId])

    if (!rows1[0]) {
        throw new Error("Bro you do not belong to this community!")
    }
    console.log(rows1[0])
    if (rows1[0].role === 'member') {
        throw new Error("Bro you can not change role in this community!")
    }
    const query2 = 'SELECT * FROM communitymember WHERE community_id = $1 and user_id = $2'
    const { rows: rows2 } = await pool.query(query2, [communityId, userId])

    if (!rows2[0]) {
        throw new Error("This user does not exist in this community!")
    }

    if (rows2[0].role == "owner") {
        throw new Error("you can not change this user's role!")
    }
    const rowId = rows2[0].id
    const query = 'UPDATE communitymember SET role = $1 WHERE id = $2 RETURNING *';
    const { rows } = await pool.query(query, [role, rowId])
    console.log(rows)
    return rows
}

export const getComminityMessagesService = async (communityId, userId) => {
    const query1 = 'SELECT * FROM communitymember WHERE community_id = $1 and user_id = $2';
    const { rows: rows1 } = await pool.query(query1, [communityId, userId])
    if (!rows1[0]) {
        throw new Error("unauthorized user!")
    }

    const query2 = 'SELECT * FROM messages WHERE community_id = $1 ORDER BY created_at ASC';
    const { rows: rows2 } = await pool.query(query2, [communityId])
    console.log("message in ", communityId, ":", rows2)
    return rows2



}