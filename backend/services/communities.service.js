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

export const getCommunities = async () => {
    const query = 'SELECT * FROM community'
    const { rows } = await pool.query(query)
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