const db = require('../config/db'); // Adjust this to your database connection file

// Request a renewal to student
exports.requestRenewal = async (req, res) => {
    const { id } = req.params; 
    const { reason, docs } = req.body;

    try {
        await db.query('BEGIN');

        // 1. Get the student_id associated with this application
        const appRes = await db.query('SELECT student_id FROM applications WHERE id = $1', [id]);
        const studentId = appRes.rows[0].student_id;

        // 2. Insert into scholarship_renewals
        const docArray = docs.split('\n').filter(d => d.trim() !== '');
        await db.query(
            'INSERT INTO scholarship_renewals (application_id, reason, required_docs_renewal) VALUES ($1, $2, $3)',
            [id, reason, JSON.stringify(docArray)]
        );

        // 3. Update application status
        await db.query('UPDATE applications SET status = $1 WHERE id = $2', ['renewing', id]);

        // 4. 🔥 INSERT NOTIFICATION HERE
        await db.query(
            'INSERT INTO notifications (student_id, title, message, application_id, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
            [studentId, 'Renewal Required', 'Action needed: New requirements have been set for your scholarship renewal.', id]
        );

        await db.query('COMMIT');
        res.status(200).json({ message: "Renewal request sent and student notified" });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error("Renewal Error:", err);
        res.status(500).json({ error: "Failed to process renewal" });
    }
};

//student get the renewal requirements and reason
exports.getRenewalCompliance = async (req, res) => {
    const { id } = req.params;

    if (!id || id === 'undefined' || isNaN(id)) {
        return res.status(400).json({ error: "Invalid Application ID" });
    }

    try {
        const result = await db.query(
            'SELECT reason, required_docs_renewal FROM scholarship_renewals WHERE application_id = $1 ORDER BY id DESC LIMIT 1',
            [parseInt(id)]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No renewal record found" });
        }

        const data = result.rows[0];
        
        // Robust JSON handling
        let docsArray = data.required_docs_renewal;
        if (typeof docsArray === 'string') {
            try { docsArray = JSON.parse(docsArray); } catch (e) { docsArray = []; }
        }

        res.status(200).json({ 
            data: {
                reason: data.reason,
                required_docs: docsArray // Send the array directly, let the frontend format it
            } 
        });
    } catch (err) {
        console.error("Fetch Renewal Error:", err);
        res.status(500).json({ error: "Failed to fetch renewal details" });
    }
};

//this is handling the  student submit renewal requiremnts
exports.submitRenewal = async (req, res) => {
    const { id } = req.params; 
    const files = req.files;   

    if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
    }
    if (!req.body.requirement_ids) {
        return res.status(400).json({ error: "Requirement labels are missing." });
    }

    try {
        await db.query('BEGIN');

        const requirementLabels = JSON.parse(req.body.requirement_ids); 

        for (let i = 0; i < files.length; i++) {
            // We use 'null' for requirement_id because these are custom renewal docs,
            // and we store the actual label in a notes or metadata field if available.
            // OR: If your table allows it, change requirement_id to TEXT.
            
            await db.query(
                `INSERT INTO application_submissions (application_id, file_path, requirement_id,source, created_at) 
                 VALUES ($1, $2, $3, 'renewal', CURRENT_TIMESTAMP)`,
                [
                  id, 
                  files[i].path.replace(/\\/g, '/').replace(/^uploads\//, ''), 
                  null // Changed from requirementLabels[i] to prevent the Integer Error
                ]
            );
        }

        await db.query("UPDATE applications SET status = 'submitted' WHERE id = $1", [id]);
        await db.query("UPDATE scholarship_renewals SET status = 'submitted' WHERE application_id = $1", [id]);

        await db.query('COMMIT');
        res.status(200).json({ message: "Renewal submission successful" });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error("Submission Error:", err);
        res.status(500).json({ error: "Failed to process submission" });
    }
};

//org or provider approve the renewal after student submit the renewal requirements
exports.approveRenewal = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE applications SET status = 'active' WHERE id = $1", [id]);
        await db.query("UPDATE scholarship_renewals SET status = 'approved' WHERE application_id = $1", [id]);
        res.status(200).json({ message: "Renewal approved successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to approve" });
    }
};

// TERMINATE THE AGREEMENT SCHOLARSHIP
exports.terminateApplication = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Capture the status from frontend

    try {
        // Update status to 'terminated'
        await db.query(
            'UPDATE applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', 
            [status || 'terminated', id]
        );
        
        res.status(200).json({ message: "Application terminated successfully" });
    } catch (err) {
        console.error("Termination Error:", err);
        res.status(500).json({ error: "Failed to terminate application" });
    }
};

//org or provider get those renewal submission from student and evaluate it 
exports.getRenewalSubmissions = async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    try {
        const result = await db.query(
            `SELECT file_path, created_at
             FROM application_submissions
             WHERE application_id = $1 AND source = 'renewal'
             ORDER BY created_at DESC`,
            [parseInt(id)]
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Fetch Submissions Error:", err);
        res.status(500).json({ error: "Failed to fetch student submissions" });
    }
};