const transporter = require('./mailer_resend'); // Adjust path to your mailer.js

const sendEmailOTP = async (targetEmail, otpCode) => {
  try {
    const mailOptions = {
      // FIX: Was hardcoded to process.env.EMAIL_USER (your old Gmail address).
      // Resend rejected this with a 403 because it tried to verify "gmail.com"
      // as the sending domain, which you don't own and can't verify.
      // Now uses RESEND_FROM_EMAIL, which is under your verified kyusisko.com domain.
      from: `"KyusISKO Security" <${process.env.RESEND_FROM_EMAIL}>`,
      to: targetEmail,
      subject: 'Your Verification Code - KyusISKO',
      // Plain text version for old email apps
      text: `Your verification code is: ${otpCode}. It will expire in 5 minutes.`,
      // HTML version for modern email apps (looks better)
      html: `
        <div style="font-family: sans-serif; max-width: 400px; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px;">
          <h2 style="color: #2563eb; margin-bottom: 10px;">KyusISKO</h2>
          <p style="color: #475569; font-size: 14px;">Use the code below to complete your login. This code is valid for <b>5 minutes</b>.</p>
          <div style="background: #f1f5f9; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #1e293b;">${otpCode}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info);
    return { success: true };
  } catch (error) {
    console.error('Email Error:', error);
    return { success: false, error };
  }
};

module.exports = { sendEmailOTP };