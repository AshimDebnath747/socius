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

export const getCommunityBySlugService = async (slug) => {
    const query = 'SELECT * FROM community WHERE slug=$1';
    const { rows } = await pool.query(query, [slug])
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
    const query1 = `
        SELECT 1
        FROM communitymember
        WHERE community_id = $1
          AND user_id = $2
    `;

    const { rows: rows1 } = await pool.query(query1, [communityId, userId]);

    if (!rows1.length) {
        throw new Error("Unauthorized user!");
    }

    const query2 = `
        SELECT
            m.*,
            u.name,
            u.avatar,
            u.email,

            (
                SELECT COUNT(*) = COUNT(delivered_at)
                FROM message_status ms
                WHERE ms.message_id = m.id
            ) AS is_delivered,

            (
                SELECT COUNT(*) = COUNT(read_at)
                FROM message_status ms
                WHERE ms.message_id = m.id
            ) AS is_read

        FROM messages m

        JOIN users u
            ON u.id = m.sender_id

        WHERE m.community_id = $1

        ORDER BY m.created_at ASC;
    `;

    const { rows } = await pool.query(query2, [communityId]);

    return rows;
};

export const getAllCommunitiesService = async () => {
    const query = 'SELECT * FROM community';
    const { rows } = await pool.query(query)
    if (!rows[0]) {
        throw new Error("No communities found Bro!")
    }
    return rows
}

export const joinRequestService = async (communityId, userId) => {
    const community = await pool.query(
        `SELECT id, is_private
     FROM community
     WHERE id = $1`,
        [communityId]
    );

    if (community.rowCount === 0) {
        throw new Error("Community not found.");
    }

    if (!community.rows[0].is_private) {
        throw new Error(
            "This is a public community. Use the join endpoint instead."
        );
    }

    // Already a member?
    const member = await pool.query(
        `SELECT 1
     FROM communitymember
     WHERE community_id = $1
     AND user_id = $2`,
        [communityId, userId]
    );

    if (member.rowCount) {
        throw new Error("You are already a member.");
    }

    // Existing pending request?
    const request = await pool.query(
        `SELECT status
     FROM community_join_requests
     WHERE community_id = $1
     AND user_id = $2 AND status='pending'`,
        [communityId, userId]
    );

    if (request.rowCount) {
        throw new Error("You already have a pending request.");
    }

    // Create request
    const response = await pool.query(
        `INSERT INTO community_join_requests
        (community_id, user_id)
     VALUES ($1, $2) RETURNING *`,
        [communityId, userId]
    );

    return response.rows
}

export const getCommunityJoinRequestsService = async (communityId, userId) => {
    const permission = await pool.query(
        `
    SELECT role
    FROM communitymember
    WHERE community_id = $1
      AND user_id = $2
      AND role IN ('owner', 'moderator')
    `,
        [communityId, userId]
    );

    if (permission.rowCount === 0) {
        throw new Error(
            "You are not authorized to view join requests."
        );
    }

    // Fetch pending join requests
    const result = await pool.query(
        `
    SELECT
      cjr.id,
      cjr.community_id,
      cjr.user_id,
      cjr.status,
      cjr.message,
      cjr.created_at,

      u.name,
      u.email,
      u.avatar

    FROM community_join_requests cjr
    JOIN users u
      ON u.id = cjr.user_id

    WHERE cjr.community_id = $1
      AND cjr.status = 'pending'

    ORDER BY cjr.created_at ASC
    `,
        [communityId]
    );

    return result.rows;
}

export const acceptJoinRequestService = async (communityId, requestId, currentUserId) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Verify owner/moderator permissions
        const permission = await client.query(
            `
      SELECT role
      FROM communitymember
      WHERE community_id = $1
        AND user_id = $2
        AND role IN ('owner', 'moderator')
      `,
            [communityId, currentUserId]
        );

        if (permission.rowCount === 0) {
            throw new Error("You are not authorized to accept join requests.");
        }

        // Get the pending join request
        const request = await client.query(
            `
      SELECT community_id, user_id, status
      FROM community_join_requests
      WHERE id = $1
        AND community_id = $2
      `,
            [requestId, communityId]
        );

        if (request.rowCount === 0) {
            throw new Error("Join request not found.");
        }

        const joinRequest = request.rows[0];

        if (joinRequest.status !== "pending") {
            throw new Error("This request has already been processed.");
        }

        // Check if already a member
        const member = await client.query(
            `
      SELECT 1
      FROM communitymember
      WHERE community_id = $1
        AND user_id = $2
      `,
            [communityId, joinRequest.user_id]
        );

        if (member.rowCount > 0) {
            throw new Error("User is already a member.");
        }

        // Add member
        await client.query(
            `
      INSERT INTO communitymember
      (
        community_id,
        user_id,
        role
      )
      VALUES ($1, $2, 'member')
      `,
            [communityId, joinRequest.user_id]
        );

        // Mark request as accepted
        await client.query(
            `
      UPDATE community_join_requests
      SET status = 'accepted'
      WHERE id = $1
      `,
            [requestId]
        );

        await client.query("COMMIT");

        return {
            success: true,
            message: "Join request accepted successfully.",
        };
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

export const rejectJoinRequestService = async (communityId, requestId, currentUserId) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Verify owner/moderator permissions
        const permission = await client.query(
            `
      SELECT role
      FROM communitymember
      WHERE community_id = $1
        AND user_id = $2
        AND role IN ('owner', 'moderator')
      `,
            [communityId, currentUserId]
        );

        if (permission.rowCount === 0) {
            throw new Error("You are not authorized to reject join requests.");
        }

        // Verify the request exists
        const request = await client.query(
            `
      SELECT status
      FROM community_join_requests
      WHERE id = $1
        AND community_id = $2
      `,
            [requestId, communityId]
        );

        if (request.rowCount === 0) {
            throw new Error("Join request not found.");
        }

        if (request.rows[0].status !== "pending") {
            throw new Error("This request has already been processed.");
        }

        // Mark as rejected
        await client.query(
            `
      UPDATE community_join_requests
      SET status = 'rejected'
      WHERE id = $1
      `,
            [requestId]
        );

        await client.query("COMMIT");

        return {
            success: true,
            message: "Join request rejected successfully.",
        };
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

export const getJoinRequestStatusService = async (communityId, userId) => {
    const result = await pool.query(
        `
        SELECT status
        FROM community_join_requests
        WHERE community_id = $1
          AND user_id = $2
        `,
        [communityId, userId]
    );
    console.log("req status :", result)
    if (result.rowCount === 0) {
        return {
            requested: false,
            status: null,
        };
    }
    return {
        requested: true,
        status: result.rows[0].status,
    };
};

export const checkMembershipService = async (communityId, userId) => {
    const result = await pool.query(
        `
        SELECT role
        FROM communitymember
        WHERE community_id = $1
          AND user_id = $2
        LIMIT 1
        `,
        [communityId, userId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}