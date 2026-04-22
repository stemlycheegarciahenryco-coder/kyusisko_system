
/*
import axios from 'axios';

/**
 * Sends an OTP via Semaphore SMS Gateway (PH)
 * @param {string} number - The recipient mobile number (e.g., 09171234567)
 * @param {string} otp - The 6-digit code to send
 */
/*
export const sendSMSOTP = async (number, otp) => {
  try {
    const response = await axios.post('https://api.semaphore.co/api/v4/messages', {
      apikey: process.env.SEMAPHORE_API_KEY, // Your API Key from .env
      number: number,
      message: `KyusISKO: Your verification code is ${otp}. Do not share this code.`,
      sendername: 'SEMAPHORE' // Note: Free accounts MUST use 'SEMAPHORE'
    });

    console.log('SMS Sent successfully:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    // Log the detailed error from Semaphore if it fails
    console.error('Semaphore API Error:', error.response?.data || error.message);
    
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to send SMS' 
    };
  }
};
*/