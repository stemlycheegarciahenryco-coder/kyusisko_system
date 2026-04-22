const transporter = require('../config/mailer'); 

// 1. VERIFICATION (Old one you had)
const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `http://localhost:5000/api/onboarding/verify/${token}`;
  const mailOptions = {
    from: `"KyusISKO Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Action Required: Verify Your Organization Account',
    html: `<h2>Welcome to KyusISKO!</h2><p>Please verify your email: <a href="${verificationUrl}">Verify Now</a></p>`
  };
  await transporter.sendMail(mailOptions);
};

// 2. APPROVAL (New - Added this)
const sendApprovalEmail = async (email, orgName) => {
  const mailOptions = {
    from: `"KyusISKO Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Congratulations! Your Organization is Approved',
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">Application Approved</h2>
        <p>Hello <strong>${orgName}</strong>,</p>
        <p>We are pleased to inform you that your registration with the <strong>KyusISKO Scholarship Portal</strong> has been validated and approved by the Root Admin.</p>
        <p>You can now log in to your dashboard to start posting scholarship programs.</p>
        <br />
        <a href="http://localhost:5173/rootlogin" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Dashboard</a>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

// 3. REJECTION (New - Added this)
const sendRejectionEmail = async (email, orgName, reason) => {
  const mailOptions = {
    from: `"KyusISKO Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Update Regarding Your Organization Registration',
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #dc2626;">Registration Update</h2>
        <p>Hello <strong>${orgName}</strong>,</p>
        <p>Thank you for your interest in the KyusISKO Portal. After reviewing your registration, we are unable to approve your account at this time for the following reason:</p>
        <div style="background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
          <strong>Reason:</strong> ${reason}
        </div>
        <p>If you have any questions or would like to re-apply with corrected information, please contact our support team.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

// DON'T FORGET TO EXPORT ALL OF THEM
module.exports = { 
  sendVerificationEmail, 
  sendApprovalEmail, 
  sendRejectionEmail 
};