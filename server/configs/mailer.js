import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true, // Reuse connections for high-volume dispatch
  maxConnections: 5,
  maxMessages: 100,
  connectionTimeout: 10000, // 10s connection timeout
  greetingTimeout: 10000,
  socketTimeout: 15000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    const mailOptions = {
      from: `"BioSync AI" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments,
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`[Mailer] Dispatch failed for ${to}:`, error.message);
    throw new Error('Failed to deliver email notification');
  }
};

export default transporter;