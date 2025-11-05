const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

const generateSampleData = async () => {
  try {
    console.log('🌱 Starting to generate sample data...');

    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Sample specializations
    const specializations = [
      'General Medicine',
      'Cardiology', 
      'Dermatology',
      'Neurology',
      'Orthopedics',
      'Pediatrics',
      'Psychiatry'
    ];

    // Create admin user
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@healthcare.com',
      password: 'admin123',
      role: 'admin',
      phone: '+1-555-0001',
      isActive: true,
      isEmailVerified: true
    });
    console.log('👤 Created admin user');

    // Create sample patients
    const patients = [];
    for (let i = 1; i <= 10; i++) {
      const patient = await User.create({
        firstName: `Patient${i}`,
        lastName: `User${i}`,
        email: `patient${i}@example.com`,
        password: 'password123',
        role: 'patient',
        phone: `+1-555-010${i}`,
        dateOfBirth: new Date(1980 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: i % 2 === 0 ? 'male' : 'female',
        address: {
          street: `${100 + i} Main St`,
          city: 'Healthcare City',
          state: 'HC',
          zipCode: `1234${i}`,
          country: 'USA'
        },
        isActive: true,
        isEmailVerified: true
      });
      patients.push(patient);
    }
    console.log('👥 Created 10 sample patients');

    // Create sample doctors
    const doctors = [];
    for (let i = 1; i <= 7; i++) {
      // Create doctor user
      const doctorUser = await User.create({
        firstName: `Dr. John${i}`,
        lastName: `Doctor${i}`,
        email: `doctor${i}@healthcare.com`,
        password: 'doctor123',
        role: 'doctor',
        phone: `+1-555-020${i}`,
        address: {
          street: `${200 + i} Medical Ave`,
          city: 'Healthcare City',
          state: 'HC',
          zipCode: `2345${i}`,
          country: 'USA'
        },
        isActive: true,
        isEmailVerified: true
      });

      // Create doctor profile
      const doctorProfile = await Doctor.create({
        user: doctorUser._id,
        specialization: specializations[i - 1],
        licenseNumber: `MD${1000 + i}`,
        experience: 5 + Math.floor(Math.random() * 20),
        qualifications: [
          {
            degree: 'MD',
            institution: 'Healthcare University',
            year: 2005 + Math.floor(Math.random() * 15)
          }
        ],
        bio: `Experienced ${specializations[i - 1]} specialist with focus on patient care and modern treatment methods.`,
        consultationFee: 100 + Math.floor(Math.random() * 200),
        availability: {
          monday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
          tuesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
          wednesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
          thursday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
          friday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
          saturday: { isAvailable: i % 2 === 0, startTime: '09:00', endTime: '13:00' },
          sunday: { isAvailable: false }
        },
        hospital: {
          name: 'Healthcare General Hospital',
          address: '123 Medical Center Blvd, Healthcare City',
          phone: '+1-555-HOSPITAL'
        },
        isVerified: true,
        totalPatients: Math.floor(Math.random() * 100),
        totalAppointments: Math.floor(Math.random() * 200)
      });

      doctors.push(doctorProfile);
    }
    console.log('👨‍⚕️ Created 7 sample doctors');

    // Create sample appointments
    const appointmentTypes = ['consultation', 'follow-up', 'routine-checkup'];
    const statuses = ['pending', 'confirmed', 'completed'];
    
    for (let i = 0; i < 20; i++) {
      const randomPatient = patients[Math.floor(Math.random() * patients.length)];
      const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() + Math.floor(Math.random() * 30)); // Next 30 days
      
      const appointmentTime = `${9 + Math.floor(Math.random() * 8)}:${Math.random() > 0.5 ? '00' : '30'}`;
      
      await Appointment.create({
        patient: randomPatient._id,
        doctor: randomDoctor._id,
        appointmentDate: randomDate,
        appointmentTime: appointmentTime,
        duration: 30,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        type: appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)],
        symptoms: `Sample symptoms for appointment ${i + 1}`,
        fee: {
          amount: randomDoctor.consultationFee,
          currency: 'USD',
          paid: Math.random() > 0.3
        }
      });
    }
    console.log('📅 Created 20 sample appointments');

    console.log('✅ Sample data generation completed successfully!');
    console.log('\n📋 Sample Login Credentials:');
    console.log('Admin: admin@healthcare.com / admin123');
    console.log('Patient: patient1@example.com / password123');
    console.log('Doctor: doctor1@healthcare.com / doctor123');

  } catch (error) {
    console.error('❌ Error generating sample data:', error);
    throw error;
  }
};

module.exports = generateSampleData;
