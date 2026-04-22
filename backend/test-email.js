require('dotenv').config();
const { sendEmailOTP } = require('./emailService');

// TEST CALL: Use your own email here to check
sendEmailOTP('stemlychee.garciahenryco@gmail.com', '998877');