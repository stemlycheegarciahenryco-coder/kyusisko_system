const nodemailer = require('nodemailer');

// FIX: pool:true reuses a small set of already-authenticated SMTP connections
// instead of opening a brand-new TCP+TLS+auth handshake on every single send.
// This cuts a lot of per-email latency, especially under concurrent registrations.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true,
  maxConnections: 5,   // how many SMTP connections can run in parallel
  maxMessages: 100,     // messages per connection before it's recycled
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = transporter;