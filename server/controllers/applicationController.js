import MemberApplication from '../models/MemberApplication.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { sendEmail } from '../configs/mailer.js'; 

export const submitApplication = asyncHandler(async (req, res) => {
  const { name, phone, email, experience, targetEmail } = req.body;
  const resume = req.file;

  if (!name || !phone || !email || !targetEmail) {
    res.status(400);
    throw new Error('Please provide all required fields.');
  }

  // Save to database first to guarantee data persistence
  const application = await MemberApplication.create({
    name,
    phone,
    email,
    experience: experience || 'None provided.',
    resumePath: resume ? resume.path : null, 
  });

  // Fire-and-forget email dispatch. Does not block the HTTP response.
  sendEmail({
    to: targetEmail,
    subject: `🚀 New BioSync AI Member Application: ${name}`,
    html: `
      <h2>New Network Member Application</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Experience:</strong><br/> ${experience || 'None provided.'}</p>
      <hr/>
      <p><em>Note: This application has been securely logged in the database.</em></p>
    `,
    attachments: resume ? [{ filename: resume.originalname, path: resume.path }] : []
  }).catch(err => {
    console.error(`[Mailer] Failed to notify admin for application ${application._id}:`, err.message);
  });

  res.status(201).json({ 
    success: true, 
    message: 'Application received successfully.',
    application 
  });
});