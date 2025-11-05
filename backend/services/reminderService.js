const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const { sendAppointmentReminder } = require('./emailService');

class ReminderService {
  constructor() {
    this.jobs = new Map();
  }

  // Start the reminder schedule
  startReminderSchedule() {
    console.log('🔔 Starting appointment reminder service...');

    // Run every hour to check for reminders
    const reminderJob = cron.schedule('0 * * * *', async () => {
      await this.checkAndSendReminders();
    }, {
      scheduled: true,
      timezone: 'America/New_York' // Adjust timezone as needed
    });

    this.jobs.set('reminderCheck', reminderJob);
    console.log('✅ Reminder service started - checking every hour');

    // Also run immediately on startup
    setTimeout(() => {
      this.checkAndSendReminders();
    }, 5000); // Wait 5 seconds after startup
  }

  // Check for appointments that need reminders
  async checkAndSendReminders() {
    try {
      console.log('🔍 Checking for appointments needing reminders...');

      const now = new Date();
      
      // Calculate time thresholds
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      // Find appointments that need 24-hour reminders
      await this.send24HourReminders(now, oneDayFromNow);
      
      // Find appointments that need 1-hour reminders
      await this.send1HourReminders(now, oneHourFromNow);

      console.log('✅ Reminder check completed');
    } catch (error) {
      console.error('❌ Error in reminder service:', error);
    }
  }

  // Send 24-hour reminders
  async send24HourReminders(now, oneDayFromNow) {
    try {
      const appointments = await Appointment.find({
        appointmentDate: {
          $gte: now,
          $lte: oneDayFromNow
        },
        status: { $in: ['pending', 'confirmed'] },
        'remindersSent.oneDayBefore': false
      })
      .populate('patient', 'firstName lastName email')
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      });

      console.log(`📧 Found ${appointments.length} appointments needing 24-hour reminders`);

      for (const appointment of appointments) {
        try {
          // Create appointment date-time for comparison
          const [hours, minutes] = appointment.appointmentTime.split(':');
          const appointmentDateTime = new Date(appointment.appointmentDate);
          appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

          // Check if it's within 24-26 hours (with 2-hour buffer)
          const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
          
          if (hoursUntilAppointment >= 22 && hoursUntilAppointment <= 26) {
            await sendAppointmentReminder(appointment);
            
            // Mark as sent
            appointment.remindersSent.oneDayBefore = true;
            await appointment.save();
            
            console.log(`✅ 24-hour reminder sent for appointment ${appointment._id}`);
          }
        } catch (error) {
          console.error(`❌ Failed to send 24-hour reminder for appointment ${appointment._id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error sending 24-hour reminders:', error);
    }
  }

  // Send 1-hour reminders
  async send1HourReminders(now, oneHourFromNow) {
    try {
      const appointments = await Appointment.find({
        appointmentDate: {
          $gte: now,
          $lte: oneHourFromNow
        },
        status: { $in: ['pending', 'confirmed'] },
        'remindersSent.oneHourBefore': false
      })
      .populate('patient', 'firstName lastName email')
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      });

      console.log(`📧 Found ${appointments.length} appointments needing 1-hour reminders`);

      for (const appointment of appointments) {
        try {
          // Create appointment date-time for comparison
          const [hours, minutes] = appointment.appointmentTime.split(':');
          const appointmentDateTime = new Date(appointment.appointmentDate);
          appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

          // Check if it's within 1-2 hours
          const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
          
          if (hoursUntilAppointment >= 0.5 && hoursUntilAppointment <= 2) {
            await sendAppointmentReminder(appointment);
            
            // Mark as sent
            appointment.remindersSent.oneHourBefore = true;
            await appointment.save();
            
            console.log(`✅ 1-hour reminder sent for appointment ${appointment._id}`);
          }
        } catch (error) {
          console.error(`❌ Failed to send 1-hour reminder for appointment ${appointment._id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error sending 1-hour reminders:', error);
    }
  }

  // Stop reminder service
  stopReminderSchedule() {
    this.jobs.forEach((job, name) => {
      job.destroy();
      console.log(`🛑 Stopped ${name} job`);
    });
    this.jobs.clear();
    console.log('🛑 Reminder service stopped');
  }

  // Get reminder service status
  getStatus() {
    return {
      isRunning: this.jobs.size > 0,
      activeJobs: Array.from(this.jobs.keys()),
      nextRun: this.jobs.has('reminderCheck') ? 'Every hour' : 'Not scheduled'
    };
  }

  // Manually trigger reminder check (for testing)
  async manualReminderCheck() {
    console.log('🔧 Manual reminder check triggered');
    await this.checkAndSendReminders();
  }

  // Send immediate reminder for specific appointment
  async sendImmediateReminder(appointmentId) {
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('patient', 'firstName lastName email')
        .populate({
          path: 'doctor',
          populate: {
            path: 'user',
            select: 'firstName lastName'
          }
        });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (appointment.status !== 'confirmed' && appointment.status !== 'pending') {
        throw new Error('Can only send reminders for confirmed or pending appointments');
      }

      await sendAppointmentReminder(appointment);
      console.log(`✅ Immediate reminder sent for appointment ${appointmentId}`);
      
      return { success: true, message: 'Reminder sent successfully' };
    } catch (error) {
      console.error(`❌ Failed to send immediate reminder for appointment ${appointmentId}:`, error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const reminderService = new ReminderService();

module.exports = reminderService;
