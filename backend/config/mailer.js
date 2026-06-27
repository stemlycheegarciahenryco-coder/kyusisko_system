const nodemailer = require('nodemailer');
const dns = require('dns');

// FIX: Render's outbound network does not support IPv6, but Gmail's DNS
// returns both an IPv4 and IPv6 address for smtp.gmail.com. Node was picking
// the IPv6 address and failing with ENETUNREACH before it could even attempt
// the connection. Forcing 'ipv4first' makes Node resolve to the IPv4 address,
// which Render CAN actually route, fixing silent OTP email failures in production.
//
// NOTE: dns.setDefaultResultOrder requires Node.js 17+. Check your Render
// service's Node version (e.g. `node --version` in a Render shell, or your
// package.json "engines" field). If you're on an older Node version, replace
// the line below with a custom `lookup` option passed directly into
// nodemailer.createTransport (uncomment the alternative block further down).
dns.setDefaultResultOrder('ipv4first');

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

  // ALTERNATIVE (only needed if Node < 17 and setDefaultResultOrder is unavailable):
  // lookup: (hostname, options, callback) => {
  //   dns.lookup(hostname, { family: 4 }, callback);
  // },
});

module.exports = transporter;