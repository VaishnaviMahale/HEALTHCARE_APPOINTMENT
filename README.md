# Healthcare Appointment System

A full-stack MERN application for managing healthcare appointments between doctors and patients.

## 🚀 Features

### Backend
- JWT-based authentication with role-based authorization
- CRUD operations for appointments
- Medical records management
- Automated email reminders using node-cron
- RESTful API design

### Frontend
- Material-UI based responsive design
- Role-based dashboards (Doctor/Patient)
- Real-time appointment management
- Protected routes and authentication

## 🛠 Tech Stack

- **Frontend:** React.js, Material-UI, React Router, Axios, Context API
- **Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, node-cron
- **Database:** MongoDB
- **Authentication:** JWT (JsonWebToken)
- **Styling:** Material-UI
- **Deployment:** Frontend (Vercel), Backend (Render/Railway)

## 📁 Project Structure

```
healthcare-appointment-system/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env
└── README.md
```

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user (doctor/patient)
- `POST /api/auth/login` - Login user

### Appointments
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Medical Records
- `GET /api/records/:patientId` - Get patient records
- `POST /api/records` - Create medical record
- `PUT /api/records/:id` - Update medical record

### Users
- `GET /api/users/doctors` - Get all doctors
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## 🔐 Environment Variables

### Backend (.env)
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
EMAIL_HOST=your_email_host
EMAIL_PORT=587
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 👥 User Roles

### Patient
- Book appointments with doctors
- View appointment history
- View medical records
- Receive appointment reminders

### Doctor
- Manage appointment requests
- View patient information
- Add/update medical records
- Set availability schedule

## 📱 Responsive Design

The application is fully responsive and works seamlessly across:
- Desktop computers
- Tablets
- Mobile devices

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- CORS protection

## 📧 Email Notifications

Automated email reminders are sent:
- 24 hours before appointment
- 1 hour before appointment
- Appointment confirmation
- Appointment cancellation

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables
3. Deploy

### Backend (Render/Railway)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy

## 📄 License

This project is licensed under the MIT License.
