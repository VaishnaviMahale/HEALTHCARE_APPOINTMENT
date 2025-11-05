const crypto = require('crypto');

// Generate random string
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Format date for display
const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return new Date(date).toLocaleDateString('en-US', defaultOptions);
};

// Format time for display
const formatTime = (time) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  
  return `${displayHour}:${minutes} ${ampm}`;
};

// Calculate age from date of birth
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Calculate BMI
const calculateBMI = (weight, height) => {
  // weight in kg, height in cm
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return Math.round(bmi * 10) / 10;
};

// Get BMI category
const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number format
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone);
};

// Generate appointment reference number
const generateAppointmentRef = () => {
  const prefix = 'APT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Check if time slot is available (helper for appointment scheduling)
const isTimeSlotAvailable = (existingAppointments, newDate, newTime, duration = 30) => {
  const [newHours, newMinutes] = newTime.split(':').map(Number);
  const newStart = newHours * 60 + newMinutes;
  const newEnd = newStart + duration;
  
  return !existingAppointments.some(appointment => {
    if (appointment.appointmentDate.toDateString() !== newDate.toDateString()) {
      return false;
    }
    
    const [appointmentHours, appointmentMinutes] = appointment.appointmentTime.split(':').map(Number);
    const appointmentStart = appointmentHours * 60 + appointmentMinutes;
    const appointmentEnd = appointmentStart + (appointment.duration || 30);
    
    // Check for overlap
    return (newStart < appointmentEnd && newEnd > appointmentStart);
  });
};

// Generate time slots for a day
const generateTimeSlots = (startTime, endTime, duration = 30, bookedSlots = []) => {
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  for (let minutes = startMinutes; minutes < endMinutes; minutes += duration) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const timeSlot = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    
    const isBooked = bookedSlots.some(slot => slot === timeSlot);
    
    slots.push({
      time: timeSlot,
      displayTime: formatTime(timeSlot),
      available: !isBooked
    });
  }
  
  return slots;
};

// Sanitize user input (basic sanitization)
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove basic HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .substring(0, 1000); // Limit length
};

// Convert string to slug (for URLs)
const createSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Deep clone object
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

// Paginate array
const paginateArray = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: array.slice(startIndex, endIndex),
    totalItems: array.length,
    totalPages: Math.ceil(array.length / limit),
    currentPage: page,
    hasNextPage: endIndex < array.length,
    hasPrevPage: startIndex > 0
  };
};

// Group array by key
const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

// Sort array of objects by multiple keys
const sortBy = (array, ...keys) => {
  return array.sort((a, b) => {
    for (let key of keys) {
      let aVal = a[key];
      let bVal = b[key];
      
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }
    return 0;
  });
};

module.exports = {
  generateRandomString,
  formatDate,
  formatTime,
  calculateAge,
  calculateBMI,
  getBMICategory,
  isValidEmail,
  isValidPhone,
  generateAppointmentRef,
  isTimeSlotAvailable,
  generateTimeSlots,
  sanitizeInput,
  createSlug,
  deepClone,
  isEmpty,
  paginateArray,
  groupBy,
  sortBy
};
