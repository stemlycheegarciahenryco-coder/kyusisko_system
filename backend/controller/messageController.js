const pool = require('../config/db'); // 👈 Point this to your actual DB connection configuration file

// 1. Send Message (Handles find-or-create thread automatically)
const sendMessage = async (req, res) => {
    try {
        const senderId = parseInt(req.user.id);
        const senderType = req.user.role; // Assumes your auth middleware provides 'student' or 'sub_admin'
        const { targetId, messageText } = req.body; 
        
        // Target ID is the opposite party. If sender is sub_admin, target is student, and vice-versa
        let subAdminId, studentId;
        if (senderType === 'sub_admin') {
            subAdminId = senderId;
            studentId = parseInt(targetId);
        } else {
            studentId = senderId;
            subAdminId = parseInt(targetId);
        }

        if (!messageText || messageText.trim() === '') {
            return res.status(400).json({ success: false, message: "Message content cannot be blank" });
        }

        // Find or create the conversation thread block
        const threadQuery = `
            INSERT INTO chat_threads (sub_admin_id, student_id, last_message, updated_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (sub_admin_id, student_id) 
            DO UPDATE SET last_message = $3, updated_at = NOW()
            RETURNING id
        `;
        const threadResult = await pool.query(threadQuery, [subAdminId, studentId, messageText]);
        const threadId = threadResult.rows[0].id;

        // Insert the actual message into the database rows
        const messageQuery = `
            INSERT INTO inbox_messages (thread_id, sender_type, sender_id, message_text)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const messageResult = await pool.query(messageQuery, [threadId, senderType, senderId, messageText]);

        res.status(201).json({
            success: true,
            data: messageResult.rows[0]
        });
    } catch (err) {
        console.error("Send Message Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Get User Threads (Loads all active conversation previews for the sidebar)
// 2. Get User Threads (Loads all active conversation previews + auto-connected approved partnerships)
const getThreads = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);
        const userRole = req.user.role;

        let query = '';
        let params = [userId];

        if (userRole === 'sub_admin') {
            query = `
                -- 1. Get existing chat channels (Sub-Admin perspective)
                SELECT 
                    t.id AS thread_id,
                    t.last_message,
                    t.updated_at,
                    s.id AS partner_id,
                    CONCAT(s.sfirst_name, ' ', s.slast_name) AS partner_name,
                    s.sprofile_pic AS partner_pic, -- 🛠️ Sub-admin sees student pic
                    s.student_email AS partner_email,
                    a.status AS application_status
                FROM chat_threads t
                JOIN students s ON t.student_id = s.id
                JOIN sub_admins sa ON t.sub_admin_id = sa.id 
                LEFT JOIN applications a ON s.id = a.student_id
                WHERE t.sub_admin_id = $1

                UNION ALL

                -- 2. Auto-include approved/renewal students ONLY if they DON'T have an existing thread
                SELECT 
                    NULL AS thread_id,
                    'Click to start conversation' AS last_message,
                    a.updated_at AS updated_at,
                    s.id AS partner_id,
                    CONCAT(s.sfirst_name, ' ', s.slast_name) AS partner_name,
                    s.sprofile_pic AS partner_pic, -- 🛠️ Matches structural slot 6
                    s.student_email AS partner_email,
                    a.status AS application_status
                FROM applications a
                JOIN students s ON a.student_id = s.id
                JOIN scholarships sp ON a.scholarship_id = sp.id 
                JOIN sub_admins sa ON sp.sub_admin_id = sa.id
                WHERE sp.sub_admin_id = $1 
                  AND LOWER(a.status) IN ('approved', 'renewal')
                  AND s.id NOT IN (
                      SELECT student_id FROM chat_threads WHERE sub_admin_id = $1
                  )
                ORDER BY updated_at DESC
            `;
        } else {
            query = `
                -- 1. Get existing chat channels (Student perspective)
                SELECT 
                    t.id AS thread_id,
                    t.last_message,
                    t.updated_at,
                    sa.id AS partner_id,
                    sa.org_name AS partner_name,
                    sa.org_pic AS partner_pic, -- 🛠️ Student sees organization pic
                    NULL AS partner_email, 
                    a.status AS application_status
                FROM chat_threads t
                JOIN sub_admins sa ON t.sub_admin_id = sa.id
                LEFT JOIN scholarships sp ON t.sub_admin_id = sp.sub_admin_id
                LEFT JOIN applications a ON sp.id = a.scholarship_id AND a.student_id = $1
                WHERE t.student_id = $1

                UNION ALL

                -- 2. Auto-include the organization ONLY if the student doesn't have an active thread
                SELECT 
                    NULL AS thread_id,
                    'Click to send your first message' AS last_message,
                    a.updated_at AS updated_at,
                    sa.id AS partner_id,
                    sa.org_name AS partner_name,
                    sa.org_pic AS partner_pic, -- 🛠️ Matches structural slot 6
                    NULL AS partner_email, 
                    a.status AS application_status
                FROM applications a
                JOIN scholarships sp ON a.scholarship_id = sp.id
                JOIN sub_admins sa ON sp.sub_admin_id = sa.id
                WHERE a.student_id = $1 
                  AND LOWER(a.status) IN ('approved', 'renewal')
                  AND sa.id NOT IN (
                      SELECT sub_admin_id FROM chat_threads WHERE student_id = $1
                  )
                ORDER BY updated_at DESC
            `;
        }

        const result = await pool.query(query, params);
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Get Threads Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};
// 3. Get Thread History (Loads the message timeline inside an active chat context window)
const getThreadMessages = async (req, res) => {
    try {
        const threadId = parseInt(req.params.threadId);
        const loggedInUserId = parseInt(req.user.id);
        const userRole = req.user.role;

        // Verify thread existence and lock access ownership permissions
        const threadCheck = await pool.query(
            'SELECT student_id, sub_admin_id FROM chat_threads WHERE id = $1',
            [threadId]
        );

        if (threadCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Conversation conversation log not found" });
        }

        const { student_id, sub_admin_id } = threadCheck.rows[0];

        // Stop illegal token manipulations
        if ((userRole === 'student' && loggedInUserId !== student_id) || 
            (userRole === 'sub_admin' && loggedInUserId !== sub_admin_id)) {
            return res.status(403).json({ success: false, message: "Access Forbidden: Unauthorized connection access parameters" });
        }

        // Set unread items to read state synchronously
        await pool.query(
            'UPDATE inbox_messages SET is_read = TRUE WHERE thread_id = $1 AND sender_id != $2',
            [threadId, loggedInUserId]
        );

        const messagesResult = await pool.query(
            'SELECT * FROM inbox_messages WHERE thread_id = $1 ORDER BY created_at ASC',
            [threadId]
        );

        res.status(200).json({ success: true, data: messagesResult.rows });
    } catch (err) {
        console.error("Get Messages Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

const getMyStatusForOrg = async (req, res) => {
    try {
        const studentId = parseInt(req.user.id);
        const { subAdminId } = req.params;

        const query = `
            SELECT a.status 
            FROM applications a
            JOIN scholarships sp ON a.scholarship_id = sp.id
            WHERE a.student_id = $1 
              AND sp.sub_admin_id = $2
            ORDER BY a.created_at DESC 
            LIMIT 1
        `;
        const result = await pool.query(query, [studentId, parseInt(subAdminId)]);

        if (result.rows.length === 0) {
            return res.status(200).json({ success: true, status: 'none' });
        }

        res.status(200).json({ success: true, status: result.rows[0].status });
    } catch (err) {
        console.error("Error in getMyStatusForOrg:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};



const getStudentStatusForOrg = async (req, res) => {
    try {
        const subAdminId = parseInt(req.user.id); // the org checking
        const { id: studentId } = req.params;

        const query = `
            SELECT a.status 
            FROM applications a
            JOIN scholarships sp ON a.scholarship_id = sp.id
            WHERE a.student_id = $1 
              AND sp.sub_admin_id = $2
            ORDER BY a.created_at DESC 
            LIMIT 1
        `;
        const result = await pool.query(query, [parseInt(studentId), subAdminId]);

        if (result.rows.length === 0) {
            return res.status(200).json({ success: true, status: 'none' });
        }

        res.status(200).json({ success: true, status: result.rows[0].status });
    } catch (err) {
        console.error("Error in getStudentStatusForOrg:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


module.exports = {
    sendMessage,
    getThreads,
    getThreadMessages,
    getMyStatusForOrg,
    getStudentStatusForOrg
};