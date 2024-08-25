import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function POST(request) {
    try {
        const { replyId, text } = await request.json();
        console.log('POST request payload:', { replyId, text });

        // Check if request payload is correctly parsed
        if (replyId === undefined || text === undefined) {
            console.log('Missing fields in request payload');
            return new Response(
                JSON.stringify({ message: 'Reply ID and text are required' }),
                { status: 400 }
            );
        }

        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];
        const userId = token ? jwt.verify(token, process.env.JWT_SECRET).userId : null;

        if (!userId) {
            console.log('Unauthorized user');
            return new Response(
                JSON.stringify({ message: 'Unauthorized' }),
                { status: 401 }
            );
        }

        // Fetch the username of the user who is replying
        const userData = await sql`
            SELECT username
            FROM users
            WHERE id = ${userId}
        `;
        if (userData.rowCount === 0) {
            console.log('User not found:', userId);
            return new Response(
                JSON.stringify({ message: 'User not found' }),
                { status: 404 }
            );
        }
        
        const username = userData.rows[0]?.username;
        console.log('Username found:', username);

        // Fetch the comment_id based on the replyId
        const replyData = await sql`
            SELECT comment_id
            FROM replies
            WHERE id = ${replyId}
        `;
        
        if (replyData.rowCount === 0) {
            console.log('Parent reply not found:', replyId);
            return new Response(
                JSON.stringify({ message: 'Parent reply not found' }),
                { status: 404 }
            );
        }

        const commentId = replyData.rows[0]?.comment_id;
        console.log('Comment ID found:', commentId);

        // Insert the new reply with the fetched comment_id
        const result = await sql`
            INSERT INTO replies (parent_reply_id, comment_id, user_id, username, text)
            VALUES (${replyId}, ${commentId}, ${userId}, ${username}, ${text})
            RETURNING id, parent_reply_id, comment_id, user_id, username, text, createdat
        `;
        
        console.log('Reply inserted:', result.rows[0]);
        return new Response(
            JSON.stringify(result.rows[0]),
            { status: 201 }
        );
    } catch (error) {
        console.error('Reply error:', error);
        return new Response(
            JSON.stringify({ message: 'Failed to add reply' }),
            { status: 500 }
        );
    }
}