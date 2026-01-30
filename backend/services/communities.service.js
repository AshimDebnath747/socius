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


export const createCommunity = async ({ name, description, rules, is_private }) => {
    const slug = await generateUniqueSlug(name)
    const query = `INSERT INTO community (name ,slug , description , rules , is_private) VALUES ($1 , $2 , $3 , $4 ,$5) RETURNING id`;

    const { rows } = await pool.query(query, [name, slug, description, rules, is_private]);
    return rows[0];

}