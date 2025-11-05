import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Avatar,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  Schedule,
  Person,
  Assessment,
  TrendingUp,
  CalendarToday,
  NotificationsActive,
  LocalHospital,
  Group,
  EventAvailable,
  PendingActions,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import AppointmentCard from '../../components/AppointmentCard';
import appointmentService from '../../services/appointmentService';
import { format } from 'date-fns';

const DoctorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [stats, setStats] = useState({});
  const [pendingAppointments, setPendingAppointments] = useState([]);
  
  const { user } = useAuth();
  const { addNotification } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load today's appointments
      const todayResponse = await appointmentService.getAppointments({ 
        today: 'true',
        sort: 'appointmentTime'
      });
      setTodayAppointments(todayResponse.data || []);
      
      // Load upcoming appointments
      const upcomingResponse = await appointmentService.getUpcomingAppointments();
      setUpcomingAppointments(upcomingResponse.data || []);
      
      // Load pending appointments
      const pendingResponse = await appointmentService.getAppointments({ 
        status: 'pending',
        limit: 5 
      });
      setPendingAppointments(pendingResponse.data || []);
      
      // Load appointment stats
      const statsResponse = await appointmentService.getAppointmentStats();
      setStats(statsResponse.data || {});
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      addNotification({
        type: 'error',
        message: 'Failed to load dashboard data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAppointment = async (appointment) => {
    try {
      await appointmentService.confirmAppointment(appointment._id);
      addNotification({
        type: 'success',
        message: 'Appointment confirmed successfully'
      });
      loadDashboardData(); // Refresh data
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to confirm appointment'
      });
    }
  };

  const handleViewAllAppointments = () => {
    navigate('/doctor-appointments');
  };

  const handleViewPatients = () => {
    navigate('/doctor-patients');
  };

  const handleViewMedicalRecords = () => {
    navigate('/medical-records');
  };

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getTodaySchedule = () => {
    return todayAppointments.map(apt => ({
      time: apt.appointmentTime,
      patient: `${apt.patient.firstName} ${apt.patient.lastName}`,
      type: apt.type,
      status: apt.status
    })).sort((a, b) => a.time.localeCompare(b.time));
  };

  return (
    <Container maxWidth="xl" className="page-container">
      {/* Welcome Section */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <Avatar
              src={user.profileImage}
              sx={{ width: 80, height: 80, mr: 3, bgcolor: 'rgba(255,255,255,0.2)' }}
            >
              {user.firstName.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h4" gutterBottom>
                {getWelcomeMessage()}, Dr. {user.firstName}!
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                {user.doctorProfile?.specialization} • {todayAppointments.length} appointments today
              </Typography>
            </Box>
          </Box>
          <Box textAlign="right">
            <Typography variant="h3" gutterBottom>
              {format(new Date(), 'dd')}
            </Typography>
            <Typography variant="h6">
              {format(new Date(), 'MMM yyyy')}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Quick Stats */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="between">
                    <Box>
                      <Typography variant="h4" color="primary">
                        {todayAppointments.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Today's Appointments
                      </Typography>
                    </Box>
                    <CalendarToday color="primary" sx={{ fontSize: 40, opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="between">
                    <Box>
                      <Typography variant="h4" color="warning.main">
                        {pendingAppointments.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pending Approvals
                      </Typography>
                    </Box>
                    <PendingActions color="warning" sx={{ fontSize: 40, opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="between">
                    <Box>
                      <Typography variant="h4" color="success.main">
                        {user.doctorProfile?.totalPatients || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Patients
                      </Typography>
                    </Box>
                    <Group color="success" sx={{ fontSize: 40, opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="between">
                    <Box>
                      <Typography variant="h4" color="info.main">
                        {user.doctorProfile?.rating?.average?.toFixed(1) || '0.0'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Average Rating
                      </Typography>
                    </Box>
                    <TrendingUp color="info" sx={{ fontSize: 40, opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Today's Schedule */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Today's Schedule</Typography>
                <Button 
                  size="small" 
                  onClick={handleViewAllAppointments}
                  endIcon={<Schedule />}
                >
                  View All
                </Button>
              </Box>
              
              {todayAppointments.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <EventAvailable sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No appointments today
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enjoy your free day!
                  </Typography>
                </Box>
              ) : (
                <List>
                  {getTodaySchedule().map((item, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <Schedule />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle1">
                                {format(new Date(`2000-01-01T${item.time}`), 'h:mm a')}
                              </Typography>
                              <Chip 
                                label={item.status} 
                                size="small" 
                                color={item.status === 'confirmed' ? 'success' : 'warning'}
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {item.patient} • {item.type}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < getTodaySchedule().length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Schedule />}
                  onClick={handleViewAllAppointments}
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  Manage Appointments
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Group />}
                  onClick={handleViewPatients}
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  View Patients
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Assessment />}
                  onClick={handleViewMedicalRecords}
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  Medical Records
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Person />}
                  onClick={() => navigate('/profile')}
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  Update Profile
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Professional Info */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Professional Info
              </Typography>
              
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Specialization:</strong> {user.doctorProfile?.specialization}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Experience:</strong> {user.doctorProfile?.experience} years
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>License:</strong> {user.doctorProfile?.licenseNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Consultation Fee:</strong> ${user.doctorProfile?.consultationFee}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Total Appointments:</strong> {user.doctorProfile?.totalAppointments || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Appointments */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Pending Appointments</Typography>
                {pendingAppointments.length > 0 && (
                  <Chip 
                    label={`${pendingAppointments.length} pending`} 
                    color="warning" 
                    size="small" 
                  />
                )}
              </Box>
              
              {pendingAppointments.length === 0 ? (
                <Box textAlign="center" py={2}>
                  <Typography variant="body2" color="text.secondary">
                    No pending appointments
                  </Typography>
                </Box>
              ) : (
                pendingAppointments.slice(0, 3).map((appointment) => (
                  <AppointmentCard
                    key={appointment._id}
                    appointment={appointment}
                    onConfirm={handleConfirmAppointment}
                    onViewDetails={(apt) => navigate(`/appointment/${apt._id}`)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DoctorDashboard;
