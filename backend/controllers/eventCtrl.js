import dotenv from "dotenv";
dotenv.config();  // Load .env variables

import Event from "../models/eventModel.js";
import nodemailer from "nodemailer";

// ✅ Email transporter using environment variables
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  },
  debug: true // Enable debug logging
});

// Verify email configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error("❌ Email configuration error:", error);
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});

// ✅ Helper function to send email
const sendEmailToClient = async (to, subject, message) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    throw new Error("Email configuration is missing. Please check your .env file.");
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      text: message,
    });
    console.log(`✅ Email sent to ${to}: ${info.response}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

// ✅ Add new event
const addEvent = async (req, res) => {
  const { name, date, time, eventId, clientName, clientPhoneNumber, clientMail } = req.body;

  // Validate required fields
  if (!name || !date || !time || !eventId || !clientName || !clientPhoneNumber || !clientMail) {
    return res.status(400).json({ 
      message: "All fields are required",
      missing: Object.entries({ name, date, time, eventId, clientName, clientPhoneNumber, clientMail })
        .filter(([_, value]) => !value)
        .map(([key]) => key)
    });
  }

  const eventDate = new Date(date);
  if (isNaN(eventDate)) {
    return res.status(400).json({ message: "Invalid date format" });
  }

  try {
    // Check if event ID already exists
    const existingEvent = await Event.findOne({ eventId });
    if (existingEvent) {
      return res.status(400).json({ 
        message: "Event ID already exists",
        existingEventId: eventId,
        suggestion: "Please use a different Event ID"
      });
    }

    const newEvent = new Event({
      name,
      date: eventDate,
      time,
      eventId,
      clientName,
      clientPhoneNumber,
      clientMail
    });

    await newEvent.save();

    try {
      // Format date for display
      const formattedDate = eventDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Format time for display
      const formattedTime = time.includes(':') ? time : `${time.slice(0, 2)}:${time.slice(2)}`;

      // 📧 Send confirmation email
      await sendEmailToClient(
        clientMail,
        "📅 Your Event Has Been Registered Successfully!",
        `Hello ${clientName},

Your event has been successfully registered.

📌 Event Details:
Event Name: ${name}
Event Date: ${formattedDate}
Event Time: ${formattedTime}
Event ID: ${eventId}
Contact Number: ${clientPhoneNumber}

Thank you for choosing us!

Best regards,
Event Planning Team
Any Issue Contact: +94714756746`
      );

      res.status(201).json({ 
        message: "Event added and email sent to client", 
        event: newEvent 
      });
    } catch (emailError) {
      // If email fails, still save the event but notify about email failure
      console.error("Email sending failed:", emailError);
      res.status(201).json({ 
        message: "Event added but email sending failed. Please check email configuration.", 
        event: newEvent,
        emailError: emailError.message
      });
    }
  } catch (err) {
    console.error("Error adding event:", err);
    res.status(500).json({ 
      message: "Server Error while adding event",
      error: err.message 
    });
  }
};

// ✅ Get all events
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();
    if (!events || events.length === 0) {
      return res.status(404).json({ message: "No events found" });
    }
    res.status(200).json({ events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Get event by ID
const getById = async (req, res) => {
  const { id } = req.params;
  try {
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json({ event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Update event
const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { name, date, time, eventId, clientName, clientMail } = req.body;

  const eventDate = new Date(date);
  if (isNaN(eventDate)) {
    return res.status(400).json({ message: "Invalid date format" });
  }

  try {
    // Update the event in the database
    const event = await Event.findByIdAndUpdate(id, {
      name,
      date: eventDate,
      time,
      eventId,
      clientName
    }, { new: true });

    // If event not found, return an error
    if (!event) return res.status(404).json({ message: "Unable to Update Event" });

    // Format date for display
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format time for display
    const formattedTime = time.includes(':') ? time : `${time.slice(0, 2)}:${time.slice(2)}`;

    // 📧 Send email after updating the event
    await sendEmailToClient(
      clientMail,
      "📅 Your Event Has Been Updated Successfully!",
      `Hello ${clientName},

Your event has been successfully updated.

📌 Event Details:
Event Name: ${name}
Event Date: ${formattedDate}
Event Time: ${formattedTime}
Event ID: ${eventId}

Thank you for choosing us!

Best regards,
Event Planning Team
Any Issue Contact: +94714756746`
    );

    // Respond with the updated event and success message
    res.status(200).json({
      message: "Event updated successfully and email sent",
      event
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};


// ✅ Delete event
const deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    // First, get the event details before deleting
    const eventToDelete = await Event.findById(id);
    
    if (!eventToDelete) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Store event details for email
    const eventDetails = {
      name: eventToDelete.name,
      clientName: eventToDelete.clientName,
      clientMail: eventToDelete.clientMail,
      date: eventToDelete.date,
      time: eventToDelete.time,
      eventId: eventToDelete.eventId
    };

    // Delete the event
    await Event.findByIdAndDelete(id);

    try {
      // Format date for display
      const formattedDate = eventDetails.date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Format time for display
      const formattedTime = eventDetails.time.includes(':') 
        ? eventDetails.time 
        : `${eventDetails.time.slice(0, 2)}:${eventDetails.time.slice(2)}`;

      // Send email to client after deleting the event
      await sendEmailToClient(
        eventDetails.clientMail,
        "📅 Your Event Has Been Deleted",
        `Hello ${eventDetails.clientName},

Your event "${eventDetails.name}" has been successfully deleted.

We are sorry for any inconvenience caused.

📌 Event Details:
Event Name: ${eventDetails.name}
Event Date: ${formattedDate}
Event Time: ${formattedTime}
Event ID: ${eventDetails.eventId}

Thank you for choosing us!

Best regards,
Event Planning Team
Any Issue Contact: +94714756746`
      );

      res.status(200).json({ 
        message: "Event deleted successfully and email sent", 
        event: eventDetails 
      });
    } catch (emailError) {
      // If email fails, still return success but notify about email failure
      console.error("Email sending failed:", emailError);
      res.status(200).json({ 
        message: "Event deleted but email sending failed. Please check email configuration.", 
        event: eventDetails,
        emailError: emailError.message
      });
    }
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ 
      message: "Server Error while deleting event",
      error: err.message 
    });
  }
};

// Update event status
const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('Status update request:', { id, status });

    // Validate status
    if (!status) {
      console.log('Status is missing in request');
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    if (!['Planned', 'In Progress', 'Completed', 'Cancelled'].includes(status)) {
      console.log('Invalid status value:', status);
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be one of: Planned, In Progress, Completed, Cancelled'
      });
    }

    // Find the event
    const event = await Event.findById(id);
    if (!event) {
      console.log('Event not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    console.log('Current event status:', event.status);
    console.log('Requested status:', status);

    // Only update if status is different
    if (event.status !== status) {
      // Add to status history
      const statusUpdate = {
        status: status,
        changedAt: new Date(),
        changedBy: req.user ? req.user.name : 'System'
      };

      event.statusHistory.push(statusUpdate);
      event.status = status;

      console.log('Updating event with new status:', status);
      await event.save();
      console.log('Event updated successfully');

      // Send notification if status is changed to Completed or Cancelled
      if (status === 'Completed' || status === 'Cancelled') {
        const message = status === 'Completed' 
          ? `Your event "${event.name}" has been marked as completed. Thank you for choosing our services!`
          : `Your event "${event.name}" has been cancelled. Please contact us if you have any questions.`;

        try {
          // Send email notification
          await sendEmailToClient(
            event.clientMail,
            `Event ${status}: ${event.name}`,
            message
          );
          console.log('Email notification sent');
        } catch (notificationError) {
          console.error('Error sending notifications:', notificationError);
          // Continue with the response even if notifications fail
        }
      }

      return res.json({
        success: true,
        message: `Event status updated to ${status}`,
        event
      });
    } else {
      console.log('Status is already set to:', status);
      return res.json({
        success: true,
        message: 'Status is already set to the requested value',
        event
      });
    }
  } catch (error) {
    console.error('Error updating event status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating event status',
      error: error.message
    });
  }
};

// Automatic status update based on date
const updateEventStatuses = async () => {
  try {
    const now = new Date();
    
    // Update past events to Completed
    await Event.updateMany(
      {
        date: { $lt: now },
        status: { $in: ['Planned', 'In Progress'] }
      },
      {
        $set: { status: 'Completed' },
        $push: {
          statusHistory: {
            status: 'Completed',
            changedAt: now,
            changedBy: 'System'
          }
        }
      }
    );

    // Update current events to In Progress
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    await Event.updateMany(
      {
        date: { $gte: oneHourAgo, $lte: oneHourFromNow },
        status: 'Planned'
      },
      {
        $set: { status: 'In Progress' },
        $push: {
          statusHistory: {
            status: 'In Progress',
            changedAt: now,
            changedBy: 'System'
          }
        }
      }
    );

    console.log('Status update completed at:', now);
  } catch (error) {
    console.error('Error in automatic status update:', error);
  }
};

// Run status update every minute instead of every hour for testing
setInterval(updateEventStatuses, 60 * 1000);

// Run initial status update
updateEventStatuses();

export {
  addEvent,
  getAllEvents,
  getById,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  updateEventStatuses
};