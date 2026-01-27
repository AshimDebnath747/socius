import { pool } from "../config/db.js";

export const getUserById = async (id) => {
  const query = `
    SELECT id , name , email , role , rating
    FROM users
    WHERE id = $1
  `;

  const { rows } = await pool.query(query, [id]);
  return rows[0];
}
export const putUser = async (name, email, skills, id) => {
  const query = `
      UPDATE users
      SET name = $1,
          email = $2,
          skills = $3
      WHERE id = $4
      RETURNING id, name, email, skills;
    `;

  const { rows } = await pool.query(query, [name, email, skills, id]);
  return rows[0]
}