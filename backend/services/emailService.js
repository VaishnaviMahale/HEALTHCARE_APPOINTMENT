const nodemailer = require('nodemailer');

// Create reusable transporter object using the default SMTP transport
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const message = {
      from: `Healthcare System <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message
    };

    const info = await transporter.sendMail(message);
    
    console.log('Email sent successfully:', info.messageId);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Email templates
const emailTemplates = {
  appointmentReminder: (appointmentData) => {
    const { patient, doctor, appointmentDate, appointmentTime, type } = appointmentData;
    
    return {
      subject: 'Appointment Reminder - Healthcare System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5aa0;">Appointment Reminder</h2>
          
          <p>Dear ${patient.firstName} ${patient.lastName},</p>
          
          <p>This is a friendly reminder about your upcoming appointment:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2c5aa0;">Appointment Details</h3>
            <p><strong>Doctor:</strong> Dr. ${doctor.user.firstName} ${doctor.user.lastName}</p>
            <p><strong>Specialization:</strong> ${doctor.specialization}</p>
            <p><strong>Date:</strong> ${new Date(appointmentDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${appointmentTime}</p>
            <p><strong>Type:</strong> ${type}</p>
          </div>
          
          <p>Please arrive 15 minutes early for your appointment.</p>
          
          <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
          
          <p>Best regards,<br>Healthcare System</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `
    };
  },

  appointmentConfirmation: (appointmentData) => {
    const { patient, doctor, appointmentDate, appointmentTime, type } = appointmentData;
    
    return {
      subject: 'Appointment Confirmed - Healthcare System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Appointment Confirmed</h2>
          
          <p>Dear ${patient.firstName} ${patient.lastName},</p>
          
          <p>Your appointment has been confirmed!</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #28a745;">Appointment Details</h3>
            <p><strong>Doctor:</strong> Dr. ${doctor.user.firstName} ${doctor.user.lastName}</p>
            <p><strong>Specialization:</strong> ${doctor.specialization}</p>
            <p><strong>Date:</strong> ${new Date(appointmentDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${appointmentTime}</p>
            <p><strong>Type:</strong> ${type}</p>
          </div>
          
          <p>We look forward to seeing you at your appointment.</p>
          
          <p>Best regards,<br>Healthcare System</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `
    };
  },

  appointmentCancellation: (appointmentData) => {
    const { patient, doctor, appointmentDate, appointmentTime, cancellationReason } = appointmentData;
    
    return {
      subject: 'Appointment Cancelled - Healthcare System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Appointment Cancelled</h2>
          
          <p>Dear ${patient.firstName} ${patient.lastName},</p>
          
          <p>Your appointment has been cancelled.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #dc3545;">Cancelled Appointment Details</h3>
            <p><strong>Doctor:</strong> Dr. ${doctor.user.firstName} ${doctor.user.lastName}</p>
            <p><strong>Date:</strong> ${new Date(appointmentDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${appointmentTime}</p>
            ${cancellationReason ? `<p><strong>Reason:</strong> ${cancellationReason}</p>` : ''}
          </div>
          
          <p>If you would like to schedule a new appointment, please contact us.</p>
          
          <p>Best regards,<br>Healthcare System</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `
    };
  },

  welcomeEmail: (userData) => {
    const { firstName, lastName, role } = userData;
    
    return {
      subject: 'Welcome to Healthcare System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5aa0;">Welcome to Healthcare System</h2>
          
          <p>Dear ${firstName} ${lastName},</p>
          
          <p>Welcome to our Healthcare System! Your ${role} account has been successfully created.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2c5aa0;">What's Next?</h3>
            ${role === 'patient' ? `
              <ul>
                <li>Browse our list of qualified doctors</li>
                <li>Book your first appointment</li>
                <li>Complete your medical profile</li>
                <li>Set up appointment reminders</li>
              </ul>
            ` : `
              <ul>
                <li>Complete your doctor profile</li>
                <li>Set your availability schedule</li>
                <li>Start managing appointments</li>
                <li>Build your patient base</li>
              </ul>
            `}
          </div>
          
          <p>If you have any questions, feel free to contact our support team.</p>
          
          <p>Best regards,<br>Healthcare System Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `
    };
  }
};

// Send specific email types
const sendAppointmentReminder = async (appointmentData) => {
  const template = emailTemplates.appointmentReminder(appointmentData);
  return await sendEmail({
    email: appointmentData.patient.email,
    subject: template.subject,
    html: template.html
  });
};

const sendAppointmentConfirmation = async (appointmentData) => {
  const template = emailTemplates.appointmentConfirmation(appointmentData);
  return await sendEmail({
    email: appointmentData.patient.email,
    subject: template.subject,
    html: template.html
  });
};

const sendAppointmentCancellation = async (appointmentData) => {
  const template = emailTemplates.appointmentCancellation(appointmentData);
  return await sendEmail({
    email: appointmentData.patient.email,
    subject: template.subject,
    html: template.html
  });
};

const sendWelcomeEmail = async (userData) => {
  const template = emailTemplates.welcomeEmail(userData);
  return await sendEmail({
    email: userData.email,
    subject: template.subject,
    html: template.html
  });
};

module.exports = {
  sendEmail,
  sendAppointmentReminder,
  sendAppointmentConfirmation,
  sendAppointmentCancellation,
  sendWelcomeEmail
};
