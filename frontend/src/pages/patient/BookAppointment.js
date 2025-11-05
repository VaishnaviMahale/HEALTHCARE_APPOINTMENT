import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Rating,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Schedule,
  Person,
  LocalHospital,
  Check,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import dayjs from 'dayjs';

import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import DoctorCard from '../../components/DoctorCard';
import userService from '../../services/userService';
import appointmentService from '../../services/appointmentService';

const validationSchema = Yup.object({
  doctorId: Yup.string().required('Please select a doctor'),
  appointmentDate: Yup.date().required('Please select a date'),
  appointmentTime: Yup.string().required('Please select a time'),
  type: Yup.string().required('Please select appointment type'),
  symptoms: Yup.string().max(500, 'Symptoms description cannot exceed 500 characters'),
});

const steps = ['Select Doctor', 'Choose Date & Time', 'Appointment Details', 'Confirmation'];

const appointmentTypes = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'follow-up', label: 'Follow-up' },
  { value: 'routine-checkup', label: 'Routine Checkup' },
  { value: 'emergency', label: 'Emergency' },
];

const BookAppointment = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { addNotification } = useApp();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      doctorId: '',
      appointmentDate: null,
      appointmentTime: '',
      type: 'consultation',
      symptoms: '',
      notes: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const appointmentData = {
          doctorId: values.doctorId,
          appointmentDate: dayjs(values.appointmentDate).format('YYYY-MM-DD'),
          appointmentTime: values.appointmentTime,
          type: values.type,
          symptoms: values.symptoms,
          notes: { patient: values.notes },
        };

        await appointmentService.createAppointment(appointmentData);
        
        addNotification({
          type: 'success',
          message: 'Appointment booked successfully!'
        });
        
        navigate('/my-appointments');
      } catch (error) {
        addNotification({
          type: 'error',
          message: error.message || 'Failed to book appointment'
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (formik.values.doctorId && formik.values.appointmentDate) {
      loadAvailableSlots();
    }
  }, [formik.values.doctorId, formik.values.appointmentDate]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const response = await userService.getDoctors();
      setDoctors(response.data || []);
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to load doctors'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      const doctor = doctors.find(d => d._id === formik.values.doctorId);
      if (!doctor || !formik.values.appointmentDate) return;

      // Generate time slots based on doctor availability
      const dayOfWeek = dayjs(formik.values.appointmentDate).format('dddd').toLowerCase();
      const availability = doctor.availability[dayOfWeek];
      
      if (!availability || !availability.isAvailable) {
        setAvailableSlots([]);
        return;
      }

      // Generate slots (this is simplified - in real app, you'd check existing appointments)
      const slots = generateTimeSlots(availability.startTime, availability.endTime);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading slots:', error);
      setAvailableSlots([]);
    }
  };

  const generateTimeSlots = (startTime, endTime, duration = 30) => {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    for (let minutes = startMinutes; minutes < endMinutes; minutes += duration) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      
      slots.push({
        time: timeString,
        available: true, // In real app, check against existing appointments
      });
    }
    
    return slots;
  };

  const handleNext = () => {
    if (activeStep === 0 && !formik.values.doctorId) {
      addNotification({ type: 'error', message: 'Please select a doctor' });
      return;
    }
    if (activeStep === 1 && (!formik.values.appointmentDate || !formik.values.appointmentTime)) {
      addNotification({ type: 'error', message: 'Please select date and time' });
      return;
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    formik.setFieldValue('doctorId', doctor._id);
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select a Doctor
            </Typography>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <Grid container spacing={3}>
                {doctors.map((doctor) => (
                  <Grid item xs={12} md={6} key={doctor._id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: selectedDoctor?._id === doctor._id ? 2 : 0,
                        borderColor: 'primary.main',
                      }}
                      onClick={() => handleDoctorSelect(doctor)}
                    >
                      <DoctorCard 
                        doctor={doctor} 
                        compact={true}
                        showBookButton={false}
                      />
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose Date & Time
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Appointment Date"
                  value={formik.values.appointmentDate}
                  onChange={(date) => formik.setFieldValue('appointmentDate', date)}
                  minDate={dayjs().add(1, 'day')}
                  maxDate={dayjs().add(30, 'day')}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth
                      error={formik.touched.appointmentDate && Boolean(formik.errors.appointmentDate)}
                      helperText={formik.touched.appointmentDate && formik.errors.appointmentDate}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Available Times</InputLabel>
                  <Select
                    value={formik.values.appointmentTime}
                    onChange={(e) => formik.setFieldValue('appointmentTime', e.target.value)}
                    disabled={!formik.values.appointmentDate || availableSlots.length === 0}
                  >
                    {availableSlots.map((slot) => (
                      <MenuItem key={slot.time} value={slot.time} disabled={!slot.available}>
                        {formatTime(slot.time)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {formik.values.appointmentDate && availableSlots.length === 0 && (
                  <Typography variant="caption" color="error">
                    No available slots for selected date
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Appointment Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Appointment Type</InputLabel>
                  <Select
                    name="type"
                    value={formik.values.type}
                    onChange={formik.handleChange}
                  >
                    {appointmentTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  name="symptoms"
                  label="Symptoms / Reason for Visit"
                  value={formik.values.symptoms}
                  onChange={formik.handleChange}
                  error={formik.touched.symptoms && Boolean(formik.errors.symptoms)}
                  helperText={formik.touched.symptoms && formik.errors.symptoms}
                  placeholder="Please describe your symptoms or reason for the appointment..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="notes"
                  label="Additional Notes (Optional)"
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                  placeholder="Any additional information for the doctor..."
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Confirm Your Appointment
            </Typography>
            <Card sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar
                      src={selectedDoctor?.user?.profileImage}
                      sx={{ width: 60, height: 60, mr: 2 }}
                    >
                      {selectedDoctor?.user?.firstName?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        Dr. {selectedDoctor?.user?.firstName} {selectedDoctor?.user?.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedDoctor?.specialization}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Rating value={selectedDoctor?.rating?.average || 0} readOnly size="small" />
                        <Typography variant="caption">
                          ({selectedDoctor?.rating?.count || 0} reviews)
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Date</Typography>
                  <Typography variant="body1">
                    {dayjs(formik.values.appointmentDate).format('MMMM DD, YYYY')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Time</Typography>
                  <Typography variant="body1">
                    {formatTime(formik.values.appointmentTime)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Type</Typography>
                  <Typography variant="body1">
                    {appointmentTypes.find(t => t.value === formik.values.type)?.label}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Fee</Typography>
                  <Typography variant="body1">
                    ${selectedDoctor?.consultationFee}
                  </Typography>
                </Grid>
                {formik.values.symptoms && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Symptoms</Typography>
                    <Typography variant="body1">{formik.values.symptoms}</Typography>
                  </Grid>
                )}
              </Grid>
            </Card>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  if (loading && activeStep === 0) {
    return <LoadingSpinner message="Loading doctors..." />;
  }

  return (
    <Container maxWidth="lg" className="page-container">
      <Box mb={4}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/patient-dashboard')}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>
        <Typography variant="h4" gutterBottom>
          Book New Appointment
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <form onSubmit={formik.handleSubmit}>
          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : <Check />}
              >
                {submitting ? 'Booking...' : 'Confirm Booking'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
              >
                Next
              </Button>
            )}
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default BookAppointment;
