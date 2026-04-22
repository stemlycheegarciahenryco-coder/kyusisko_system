const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// We are removing pdf-lib since it's causing the "PDFDict" and "Invalid Object" errors
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const validateDocument = async (files, studentData) => {
    // 1. Using the correct model name for your tier
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    try {
        const pdfParts = await Promise.all(files.map(async (file) => {
            const absolutePath = path.resolve(file.path);
            if (!fs.existsSync(absolutePath)) return null;

            // We send the full buffer directly. 
            // Gemini 3 can handle full PDFs much better than older versions.
            const fileBuffer = fs.readFileSync(absolutePath);

            return {
                inlineData: {
                    data: fileBuffer.toString("base64"),
                    mimeType: "application/pdf"
                }
            };
        }));

        const finalParts = pdfParts.filter(p => p !== null);
        if (finalParts.length === 0) return { isMatch: false, details: "No valid PDFs found." };

       const prompt = `
            You are the KyusIsko Document Auditor specialized in Philippine Education documents (DepEd & CHED).
            Compare the attached PDF(s) with these target details:
            - Student Name: ${studentData.sfirst_name} ${studentData.slast_name}
            - Input GWA/Average: ${studentData.gwa}

            Task: 
            1. Identify the document type: Look for Form 137, SF9 (Report Card), SF10, Good Moral Certificate, or TOR.
            2. For SF9/Report Cards: Look for the "General Average" or "Final Rating" column.
            3. For Good Moral/COE: Verify the student name and school year to ensure the document is current.
            4. Comparison: Check if the name on the document matches the student's input and if the GWA is consistent.

            Return ONLY valid JSON:
            {
                "isMatch": true/false,
                "extractedName": "exact name found on doc",
                "extractedGwa": "average found on doc",
                "documentType": "SF9 / Good Moral / TOR / etc",
                "details": "short explanation of the match or reason for mismatch"
            }
        `;

        // 2. API Call
        const result = await model.generateContent([prompt, ...finalParts]);
        const response = await result.response;
        const text = response.text().replace(/```json|```/g, "").trim();
        
        return JSON.parse(text);

    } catch (error) {
        console.error("Gemini 3 Error:", error);
        // Handle the "High Demand" or "Quota" error gracefully
        if (error.status === 503 || error.status === 429) {
            return { isMatch: false, details: "AI is busy. Please try again in a few seconds." };
        }
        return { isMatch: false, details: "System could not read the PDF." };
    }
};

module.exports = { validateDocument };