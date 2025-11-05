# Healthcare Appointment System - Setup Guide

## 🚀 Quick Start

This guide will help you set up the Healthcare Appointment System on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- Git

### 📁 Project Structure

```
healthcare-appointment-system/
├── backend/          # Node.js/Express API
├── frontend/         # React.js application
├── README.md         # Project overview
└── SETUP_GUIDE.md   # This file
```

## ⚙️ Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the environment example file:
```bash
copy .env.example .env    # Windows
# or
cp .env.example .env      # Linux/Mac
```

Edit the `.env` file with your configuration:
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/healthcare_appointment_db
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/healthcare_appointment_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Email Configuration (for reminders)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# CORS Configuration
CLIENT_URL=http://localhost:3000
```

### 4. Database Setup
Run the setup script to create sample data:
```bash
node setup.js
```

This will:
- Connect to your MongoDB database
- Create sample users (patients, doctors, admin)
- Generate sample appointments
- Provide login credentials

### 5. Start the Backend Server
```bash
npm run dev
```

The backend will be available at `http://localhost:5000`

## 🎨 Frontend Setup

### 1. Navigate to Frontend Directory (in a new terminal)
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the environment example file:
```bash
copy .env.example .env    # Windows
# or
cp .env.example .env      # Linux/Mac
```

Edit the `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=Healthcare Appointment System
REACT_APP_VERSION=1.0.0
```

### 4. Start the Frontend Application
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## 📋 Sample Login Credentials

After running the setup script, you can use these credentials:

| Role    | Email                    | Password    | Description |
|---------|--------------------------|-------------|-------------|
| Admin   | admin@healthcare.com     | admin123    | System administrator |
| Patient | patient1@example.com     | password123 | Sample patient account |
| Doctor  | doctor1@healthcare.com   | doctor123   | Sample doctor account |

## 🔧 Development Scripts

### Backend Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
node setup.js      # Generate sample data
```

### Frontend Scripts
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run eject      # Eject from Create React App (not recommended)
```

## 🗄️ Database Information

### MongoDB Collections
- `users` - User accounts (patients, doctors, admins)
- `doctors` - Doctor profiles and specializations
- `appointments` - Appointment bookings and details
- `medicalrecords` - Patient medical records

### Sample Data Includes
- 1 Admin user
- 10 Patient users
- 7 Doctor users (different specializations)
- 20 Sample appointments

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Appointments
- `GET /api/appointments` - Get appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Users
- `GET /api/users/doctors` - Get all doctors
- `GET /api/users/doctors/:id` - Get doctor details
- `PUT /api/users/profile` - Update user profile

### Medical Records
- `GET /api/records` - Get medical records
- `POST /api/records` - Create medical record
- `PUT /api/records/:id` - Update medical record

## 🎯 Features Overview

### For Patients
- Browse and search doctors by specialization
- Book appointments with available time slots
- View appointment history and status
- Access medical records
- Receive email reminders

### For Doctors
- Manage appointment requests (approve/cancel)
- View patient information and medical history
- Create and update medical records
- Set availability schedule
- Dashboard with today's appointments

### For Admins
- User management and oversight
- System statistics and reports
- Content moderation capabilities

## 🛠️ Troubleshooting

### Common Issues

#### MongoDB Connection Error
```
Error: MongoDB connection failed
```
**Solution:** Ensure MongoDB is running locally or check your MongoDB Atlas connection string.

#### Port Already in Use
```
Error: Port 5000 is already in use
```
**Solution:** Change the PORT in your `.env` file or stop the process using port 5000.

#### CORS Errors
```
Access to fetch blocked by CORS policy
```
**Solution:** Ensure CLIENT_URL in backend `.env` matches your frontend URL.

#### Email Configuration
If email reminders aren't working, check your email configuration in the `.env` file. For Gmail, you'll need to use an App Password instead of your regular password.

### Getting Help

If you encounter issues:
1. Check that all dependencies are installed
2. Verify your environment variables
3. Ensure MongoDB is running
4. Check the console for error messages
5. Refer to the README.md for additional information

## 🚀 Production Deployment

### Backend Deployment (Render/Railway)
1. Create account on Render or Railway
2. Connect your GitHub repository
3. Set environment variables in the platform
4. Deploy the backend service

### Frontend Deployment (Vercel)
1. Create account on Vercel
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set environment variables
5. Deploy

### Database (MongoDB Atlas)
1. Create MongoDB Atlas account
2. Create a cluster
3. Add database user
4. Update MONGODB_URI in environment variables

## 📝 Next Steps

After successful setup:
1. Explore the different dashboards (Patient, Doctor, Admin)
2. Test the appointment booking flow
3. Try the medical records functionality
4. Customize the application for your needs
5. Add additional features as required

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

Happy coding! 🎉
