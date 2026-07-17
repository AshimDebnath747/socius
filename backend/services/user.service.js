import { pool } from "../config/db.js";

export const getUserById = async (id) => {
  const userQuery = `
    SELECT
      id,
      name,
      email,
      
      role,
      avatar,
      headline,
      bio,
      about,
      location,
      website,
      skills,
      rating,
      created_at
    FROM users
    WHERE id = $1;
  `;

  const statsQuery = `
    SELECT
      (SELECT COUNT(*)
       FROM session
       WHERE helper_id = $1 ) AS total_helped,
       (SELECT COUNT(*)
       FROM session
       WHERE requester_id = $1) AS total_requested,

      (SELECT COUNT(*)
       FROM review
       WHERE reviewed_user_id = $1) AS total_reviews,

      (SELECT ROUND(AVG(rating), 1)
       FROM review
       WHERE reviewed_user_id = $1) AS average_rating,

      (SELECT COUNT(*)
       FROM communitymember
       WHERE user_id = $1) AS communities_joined;
  `;

  const communityQuery = `
    SELECT
      c.id,
      c.name,
      c.avatar,
      c.is_private,
      COUNT(cm2.user_id) AS total_members
    FROM communitymember cm
    JOIN community c
      ON cm.community_id = c.id
    LEFT JOIN communitymember cm2
      ON cm2.community_id = c.id
    WHERE cm.user_id = $1
    GROUP BY
      c.id,
      c.name,
      c.avatar
    ORDER BY c.name;
  `;

  const [userResult, statsResult, communityResult] = await Promise.all([
    pool.query(userQuery, [id]),
    pool.query(statsQuery, [id]),
    pool.query(communityQuery, [id]),
  ]);

  return {
    user: userResult.rows[0],
    stats: statsResult.rows[0],
    communities: communityResult.rows,
  };
};
export const putUser = async (
  id,
  name,
  headline,
  bio,
  about,
  location,
  website,
  skills
) => {
  const query = `
    UPDATE users
    SET
      name = $1,
      headline = $2,
      bio = $3,
      about = $4,
      location = $5,
      website = $6,
      skills = $7
    WHERE id = $8
    RETURNING
      id,
      name,
      email,
      role,
      avatar,
      headline,
      bio,
      about,
      location,
      website,
      skills,
      rating,
      created_at;
  `;

  const { rows } = await pool.query(query, [
    name,
    headline,
    bio,
    about,
    location,
    website,
    skills,
    id,
  ]);

  return rows[0];
};

export const getReviewsById = async (userId, page, limit) => {
  const offset = (page - 1) * limit;

  const { rows: userRows } = await pool.query(
    "SELECT id, average_rating FROM users WHERE id = $1",
    [userId],
  );

  if (!userRows[0]) {
    throw new Error("No user found!");
  }

  const { rows: reviews } = await pool.query(
    `SELECT id, session_id, reviewer_id, rating, comment, created_at
     FROM review
     WHERE reviewed_user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM review WHERE reviewed_user_id = $1`,
    [userId],
  );

  const totalReviews = parseInt(countRows[0].count);

  return {
    user_id: userId,
    average_rating: userRows[0].average_rating,
    total_reviews: totalReviews,
    page,
    limit,
    reviews,
  };
};

//  get the next user by ID to chat with

export const getNextUserById = async (
  helper_id,
  requester_id,
  currentUserId,
) => {
  const query = `
    SELECT id, name, email, role, rating
    FROM users
    WHERE id = $1
  `;
  console.log("current use id:", currentUserId)
  if (helper_id == null || requester_id == null || currentUserId == null) {
    throw new Error(
      "helper_id, requester_id, and current user id are required",
    );
  }

  let targetId;
  let role;

  if (currentUserId == helper_id) {
    targetId = requester_id;
    role = "requester";
  } else if (currentUserId == requester_id) {
    targetId = helper_id;
    role = "helper";
  } else {
    throw new Error("Authenticated user is not a participant in this chat");
  }

  const { rows } = await pool.query(query, [targetId]);
  rows[0].role = role;
  console.log("next user:", rows[0]);

  return rows[0];
};

// Update the user's avatar in the database
export const updateAvatarService = async (userId, avatar) => {
  const query = `
    UPDATE users
    SET avatar = $1
    WHERE id = $2
    RETURNING id,
      name,
      email,
      
      role,
      avatar,
      headline,
      bio,
      about,
      location,
      website,
      skills,
      rating,
      created_at;
  `;

  const { rows } = await pool.query(query, [avatar, userId]);

  return rows[0];
};
