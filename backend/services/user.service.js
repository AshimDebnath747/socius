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

export const getReviewsById = async (userId, page, limit) => {
  const offset = (page - 1) * limit

  const { rows: userRows } = await pool.query(
    "SELECT id, average_rating FROM users WHERE id = $1",
    [userId]
  );

  if (!userRows[0]) {
    throw new Error("No user found!")
  }

  const { rows: reviews } = await pool.query(
    `SELECT id, session_id, reviewer_id, rating, comment, created_at
     FROM review
     WHERE reviewed_user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM review WHERE reviewed_user_id = $1`,
    [userId]
  );

  const totalReviews = parseInt(countRows[0].count);

  return {
    user_id: userId,
    average_rating: userRows[0].average_rating,
    total_reviews: totalReviews,
    page,
    limit,
    reviews
  }
}

//  get the next user by ID to chat with

export const getNextUserById = async (helper_id, requester_id, currentUserId) => {
  const query = `
    SELECT id, name, email, role, rating
    FROM users
    WHERE id = $1
  `;

  if (helper_id == null || requester_id == null || currentUserId == null) {
    throw new Error("helper_id, requester_id, and current user id are required");
  }


  let targetId;

  if (currentUserId === helper_id) {
    targetId = requester_id;
  } else if (currentUserId === requester_id) {
    targetId = helper_id;
  } else {
    throw new Error("Authenticated user is not a participant in this chat");
  }

  const { rows } = await pool.query(query, [targetId]);
  return rows[0];
}
