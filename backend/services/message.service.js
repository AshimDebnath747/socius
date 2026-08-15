import { pool } from "../config/db.js";

export async function sendMessage({
    type,
    senderId,
    content,
    sessionId = null,
    communityId = null,

    messageType = "text",
    mediaUrl = null,
    mediaName = null,
    mediaMimeType = null,
    mediaSize = null,
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert message
    const { rows } = await client.query(
    `
    INSERT INTO messages (
        session_id,
        community_id,
        sender_id,
        content,
        message_type,
        media_url,
        media_name,
        media_mime_type,
        media_size
    )
    VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9
    )
    RETURNING *;
    `,
    [
        sessionId,
        communityId,
        senderId,
        content,

        messageType,
        mediaUrl,
        mediaName,
        mediaMimeType,
        mediaSize,
    ]
);

    const message = rows[0];

    let participants = [];

    if (type === "community") {
      const { rows } = await client.query(
        `
                SELECT user_id
                FROM communitymember
                WHERE community_id = $1
                AND user_id <> $2
                `,
        [communityId, senderId],
      );

      participants = rows;
    } else {
      const { rows } = await client.query(
        `
    SELECT
    CASE
        WHEN requester_id = $2 THEN helper_id
        WHEN helper_id = $2 THEN requester_id
    END AS user_id
FROM session
WHERE id = $1
AND (requester_id = $2 OR helper_id = $2)
    `,
        [sessionId, senderId],
      );
      participants = rows;
    }

    // Insert status rows
    if (participants.length) {
      const placeholders = [];
      const values = [];

      participants.forEach((p, i) => {
        placeholders.push(`($${i * 2 + 1}, $${i * 2 + 2})`);

        values.push(message.id);
        values.push(p.user_id);
      });

      await client.query(
        `
                INSERT INTO message_status
                (message_id, user_id)
                VALUES ${placeholders.join(",")}
                `,
        values,
      );
    }
    const { rows: messageRows } = await client.query(
      `
    SELECT
        m.*,
        u.name,
        u.avatar,
        u.email,
        EXISTS (
            SELECT 1
            FROM message_status ms
            WHERE ms.message_id = m.id
              AND ms.delivered_at IS NOT NULL
        ) AS is_delivered,
        EXISTS (
            SELECT 1
            FROM message_status ms
            WHERE ms.message_id = m.id
              AND ms.read_at IS NOT NULL
        ) AS is_read
    FROM messages m
    JOIN users u
      ON u.id = m.sender_id
    WHERE m.id = $1
    `,
      [message.id],
    );

    const fullMessage = messageRows[0];
    console.log("full message:,", fullMessage);
    await client.query("COMMIT");

    return {
      fullMessage,
      participants,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
