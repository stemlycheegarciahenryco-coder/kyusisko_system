const { Resend } = require('resend');

// FIX: Switched from Gmail SMTP (nodemailer) to Resend's HTTPS API.
// This completely avoids the Render IPv6/ENETUNREACH networking issue, since
// it's a normal HTTPS API call instead of a raw SMTP socket connection.
const resend = new Resend(process.env.RESEND_API_KEY);

// Set this to a verified sender on your Resend account.
// Until you verify a domain, you can ONLY send from 'onboarding@resend.dev'
// and ONLY to the email address you signed up to Resend with — fine for
// testing, NOT usable for real students. Verify a domain in the Resend
// dashboard, then change this to something like 'noreply@yourdomain.com'.
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

// Wrapper object that mimics nodemailer's transporter.sendMail() shape, so
// every existing call site (RegStudentRoutes.js, emailServiceOrg.js, etc.)
// keeps working unchanged — no need to touch any other file.
const transporter = {
  sendMail: async (mailOptions) => {
    const { from, to, subject, html, text } = mailOptions;

    const { data, error } = await resend.emails.send({
      from: from && from.includes('@') ? from : DEFAULT_FROM,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      // Throw so existing .catch()/try-catch blocks in calling code behave
      // exactly like a failed nodemailer sendMail() call.
      throw new Error(typeof error === 'string' ? error : JSON.stringify(error));
    }

    return data;
  },
};

module.exports = transporter;