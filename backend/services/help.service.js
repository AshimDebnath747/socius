import { pool } from "../config/db.js";

export const postHelpRequest = async (
  title,
  description,
  categoryId,
  urgency,
  preferredMode,
  communityId,
  userId,
  image,
) => {
  // Check if user belongs to the community (if communityId is provided)
  if (communityId != null) {
    const query1 =
      "SELECT 1 FROM communitymember WHERE community_id = $1 AND user_id = $2";

    const { rows: rows1 } = await pool.query(query1, [communityId, userId]);

    if (!rows1[0]) {
      throw new Error("You are not a part of this community!");
    }
  }

  const query = `
        INSERT INTO helprequest
        (
            title,
            description,
            category_id,
            urgency,
            preferred_mode,
            created_by,
            community_id,
            image
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
    `;

  const { rows } = await pool.query(query, [
    title,
    description,
    categoryId,
    urgency,
    preferredMode,
    userId,
    communityId,
    image,
  ]);

  return rows[0];
};

export const getHelpRequest = async (communityId, status) => {
  if (!communityId) {
    const query = `
        SELECT
            h.*,
            u.name,
            u.avatar
        FROM helprequest h
        JOIN users u
            ON h.created_by = u.id
        WHERE h.community_id IS NULL
          AND h.req_status = $1
        ORDER BY h.created_at DESC
    `;

    const { rows } = await pool.query(query, [status]);
    return rows;
  } else {
    const query = `
        SELECT
            h.*,
            u.name
        FROM helprequest h
        JOIN users u
            ON h.created_by = u.id
        WHERE h.community_id = $1
          AND h.req_status = $2
        ORDER BY h.created_at DESC
    `;

    const { rows } = await pool.query(query, [communityId, status]);
    return rows;
  }
};

export const getHelpRequestById = async (id) => {
  //I think this function needs improvements but I don't have anything in mind rn .. will think in future

  const query = `
    SELECT
        h.*,
        u.name,
        u.avatar
    FROM helprequest h
    JOIN users u
        ON h.created_by = u.id
    WHERE h.id = $1
`;

  const { rows } = await pool.query(query, [id]);

  if (!rows[0]) {
    throw new Error("There might be some problem in server!");
  }

  return rows[0];
};

export const closeHelpRequest = async (id) => {
  const query = "UPDATE helprequest SET status = $1 WHERE id = $2 RETURNING *";

  const { rows } = await pool.query(query, ["closed", id]);

  if (!rows[0]) {
    throw new Error("The help Request id is not valid!");
  }

  console.log(rows);

  return rows[0];
};
