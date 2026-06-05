const transporter = require('../config/mailer'); 

// 1. OTP VERIFICATION
const sendOrgOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"KyusISKO Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${otp} is your Organization Verification Code`,
    html: `
      <div style="font-family: 'Inter', sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 15px; max-width: 500px; margin: auto;">
        <h2 style="color: #093fb4; text-align: center;">Verify Your Organization</h2>
        <p>Hello,</p>
        <p>Thank you for joining <strong>KyusISKO</strong>. Please use the verification code below to complete your organization's registration:</p>
        <div style="background: #f8fafc; border: 2px dashed #cbd5e1; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #1e293b;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #64748b; text-align: center;">
          This code will expire in 10 minutes. If you did not request this, please ignore this email.
        </p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

// 2. APPROVAL
const sendApprovalEmail = async (email, orgName) => {
  const mailOptions = {
    from: `"KyusISKO Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Congratulations! Your Organization is Approved',
    html: `
      <div style="font-family: 'Inter', sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: auto;">
        <h2 style="color: #093fb4;">Application Approved</h2>
        <p>Hello <strong>${orgName}</strong>,</p>
        <p>We are pleased to inform you that your registration with the <strong>KyusISKO Scholarship Portal</strong> has been validated and approved by the Root Admin.</p>
        <p>You can now log in to your dashboard to start posting scholarship programs.</p>
        <br />
        <a href="http://localhost:5173/rootlogin" style="background: #093fb4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Dashboard</a>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

// 3. REJECTION WITH COMPLIANCE LINK & STEP-BY-STEP FLOW
const sendRejectionEmail = async (email, orgName, reason, orgId) => {
  const complianceLink = `http://localhost:5173/compliance/${orgId}`;

  const mailOptions = {
    from: `"KyusISKO Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Action Required: Re-submit Requirements for KyusISKO Registration',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 550px; background: #FFFCFB; border: 1px solid #e2e8f0; border-radius: 24px; padding: 32px; color: #1e293b; margin: auto;">
        
        <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: #093fb4; margin: 0 0 4px 0;">Verification Status Update</p>
        <h2 style="font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; color: #0f172a; margin: 0 0 16px 0; font-style: italic;">Action Required: Action Form Compliance</h2>
        
        <p style="font-size: 14px; font-weight: 500; line-height: 1.6; color: #64748b;">
          Hello <strong>${orgName}</strong>,<br /><br />
          Kindly Comply with the document requirements. Kindly click the button below to upload the updated compliance documents based on the reason of rejection provided. Your resubmission will be reviewed again so that it will abide by our application guidelines. Thank you for your consideration.
        </p>

        <div style="background: #fef2f2; border: 1px solid #fee2e2; border-radius: 16px; padding: 16px; margin: 24px 0;">
          <p style="font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #b91c1c; margin: 0 0 4px 0;">Reason for Rejection / Notes:</p>
          <p style="font-size: 13px; font-weight: 600; color: #991b1b; margin: 0; font-style: italic;">
            "${reason || 'No specific reason provided. Please verify missing records.'}"
          </p>
        </div>

        <p style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #94a3b8; margin: 0 0 12px 0;">Follow these steps to update your registrations:</p>
        
        <ol style="margin: 0 0 28px 0; padding-left: 20px; font-size: 13px; font-weight: 600; color: #334155; line-height: 2;">
          <li>Review the specific reason for rejection provided above.</li>
          <li>Prepare clear, updated digital copies of the missing or rejected documents.</li>
          <li>Click the secure button below to upload your updated compliance documents.</li>
          <li>Submit the records so our team can immediately process your profile re-evaluation.</li>
        </ol>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${complianceLink}" style="display: inline-block; background: #093fb4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em;">
            Upload Compliance Documents
          </a>
        </div>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 16px;" />
        <p style="font-size: 11px; font-weight: 500; color: #94a3b8; text-align: center; margin: 0;">
          Your updated resubmission will be placed under prompt review to ensure your status complies with our onboarding guidelines. Thank you for your cooperation.
        </p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { 
  sendOrgOTPEmail,
  sendApprovalEmail, 
  sendRejectionEmail 
};