import axios from 'axios';

export const sendIndianSMS = async (phoneNumber, otp) => {
  if (!phoneNumber) {
    throw new Error('Mobile number is required');
  }

  // Strip country codes (+91, 91, 0) and non-numeric characters to keep exact 10 digits
  const cleanNumber = phoneNumber.toString().replace(/[^0-9]/g, '').slice(-10);

  if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
    throw new Error('Invalid Indian mobile number. Must be a 10-digit number starting with 6, 7, 8, or 9.');
  }

  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        variables_values: otp.toString(),
        route: 'otp',
        numbers: cleanNumber,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
        },
        timeout: 8000, // 8s timeout to prevent thread blocking
      }
    );

    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('[SMS] Fast2SMS Dispatch Error:', errorMsg);
    throw new Error(`SMS delivery failed: ${errorMsg}`);
  }
};