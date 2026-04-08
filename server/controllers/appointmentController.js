import Appointment from '../models/Appointment.js'; // The model you created earlier

export const bookAppointment = async (req, res) => {
  try {
    const { address, scheduledDate } = req.body;

    const appointment = await Appointment.create({
      user: req.user._id,
      address,
      scheduledDate, // Keeping it as a string for this prototype
      status: 'PENDING'
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to book appointment' });
  }
};