const transporter = require('./mailer_resend'); 

// 1. OTP VERIFICATION
const sendOrgOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"KyusISKO Portal" <${process.env.RESEND_FROM_EMAIL}>`,
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
    from: `"KyusISKO Portal" <${process.env.RESEND_FROM_EMAIL}>`,
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
    from: `"KyusISKO Portal" <${process.env.RESEND_FROM_EMAIL}>`,
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
// 4. REQUEST SPECIFIC REQUIREMENTS (NEW)
const sendRequirementsEmail = async (email, orgName, requirementsArray, orgId) => {
  const complianceLink = `http://localhost:5173/compliance/${orgId}`;

  // FIX: Dynamically construct safe HTML list components from string arrays
  const formattedListItems = Array.isArray(requirementsArray)
    ? requirementsArray.map(item => `
        <li style="margin-bottom: 8px; font-size: 13px; font-weight: 600; color: #1e293b;">
          ${item}
        </li>`).join('')
    : `<li style="font-size: 13px; font-weight: 600; color: #1e293b;">${requirementsArray}</li>`;

  const mailOptions = {
    from: `"KyusISKO Portal" <${process.env.RESEND_FROM_EMAIL}>`,
    to: email,
    subject: 'Action Required: Submit Additional Documents for KyusISKO',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 550px; background: #FFFCFB; border: 1px solid #e2e8f0; border-radius: 24px; padding: 32px; color: #1e293b; margin: auto;">
        
        <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: #093fb4; margin: 0 0 4px 0;">Onboarding Status Update</p>
        <h2 style="font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; color: #0f172a; margin: 0 0 16px 0;">Additional Documents Needed</h2>
        
        <p style="font-size: 14px; font-weight: 500; line-height: 1.6; color: #64748b;">
          Hello <strong>${orgName}</strong>,<br /><br />
          Thank you for registering with KyusISKO. To proceed with the approval of your organization's account, our review team requires the following specific documents:
        </p>

        <div style="background: #EEF2FF; border: 1px solid #c7d2fe; border-radius: 16px; padding: 20px; margin: 24px 0;">
          <p style="font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #3730a3; margin: 0 0 10px 0;">Requested Documents Checklist:</p>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
            ${formattedListItems}
          </ul>
        </div>

        <p style="font-size: 13px; font-weight: 500; line-height: 1.6; color: #64748b; margin-bottom: 24px;">
          Please prepare clear, digital copies of the requested files. Click the secure link below to access your compliance portal and upload these documents.
        </p>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${complianceLink}" style="display: inline-block; background: #093fb4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em;">
            Upload Required Documents
          </a>
        </div>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 16px;" />
        <p style="font-size: 11px; font-weight: 500; color: #94a3b8; text-align: center; margin: 0;">
          Your application will remain pending until these documents are submitted. Thank you for your cooperation.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// 5. APPROVAL CREDENTIALS (NEW)
// Sent automatically right after approval — delivers the Provider ID and
// generated password the org needs to log in. Kept separate from
// sendApprovalEmail so the original approval notice is untouched.
const sendApprovalCredentialsEmail = async (email, orgName, providerCode, password) => {
  const loginLink = `http://localhost:5173/rootlogin`;

  const mailOptions = {
    from: `"KyusISKO Portal" <${process.env.RESEND_FROM_EMAIL}>`,
    to: email,
    subject: 'Your KyusISKO Provider Login Credentials',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 550px; background: #FFFCFB; border: 1px solid #e2e8f0; border-radius: 24px; padding: 32px; color: #1e293b; margin: auto;">

        <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: #093fb4; margin: 0 0 4px 0;">Account Access Granted</p>
        <h2 style="font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; color: #0f172a; margin: 0 0 16px 0; font-style: italic;">Your Login Credentials</h2>

        <p style="font-size: 14px; font-weight: 500; line-height: 1.6; color: #64748b;">
          Hello <strong>${orgName}</strong>,<br /><br />
          Your organization has been approved on the <strong>KyusISKO Scholarship Portal</strong>. Below are your login credentials — please keep them secure and change your password after your first login if that option is available.
        </p>

        <div style="background: #EEF2FF; border: 1px solid #c7d2fe; border-radius: 16px; padding: 20px; margin: 24px 0;">
          <p style="font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #3730a3; margin: 0 0 10px 0;">Login Details:</p>
          <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #1e293b;">
            Provider ID: <span style="font-weight: 900; color: #093fb4;">${providerCode}</span>
          </p>
          <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #1e293b;">
            Email: <span style="font-weight: 900; color: #093fb4;">${email}</span>
          </p>
          <p style="margin: 0; font-size: 13px; font-weight: 600; color: #1e293b;">
            Password: <span style="font-weight: 900; color: #093fb4; letter-spacing: 0.05em;">${password}</span>
          </p>
        </div>

        <p style="font-size: 13px; font-weight: 500; line-height: 1.6; color: #64748b; margin-bottom: 24px;">
          You may log in using either your Provider ID or your email address, along with the password above.
        </p>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${loginLink}" style="display: inline-block; background: #093fb4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em;">
            Log In to Dashboard
          </a>
        </div>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 16px;" />
        <p style="font-size: 11px; font-weight: 500; color: #94a3b8; text-align: center; margin: 0;">
          For security, please do not share these credentials. If you did not expect this email, contact our support team immediately.
        </p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { 
  sendOrgOTPEmail,
  sendApprovalEmail, 
  sendRejectionEmail,
  sendRequirementsEmail,
  sendApprovalCredentialsEmail
};