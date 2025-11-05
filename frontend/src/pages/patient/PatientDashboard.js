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
  IconButton,
  Paper,
} from '@mui/material';
import {
  Add,
  LocalHospital,
  Schedule,
  Person,
  Assessment,
  TrendingUp,
  CalendarToday,
  NotificationsActive,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import AppointmentCard from '../../components/AppointmentCard';
import appointmentService from '../../services/appointmentService';
import userService from '../../services/userService';

const PatientDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({});
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  
  const { user } = useAuth();
  const { addNotification } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load upcoming appointments
      const upcomingResponse = await appointmentService.getUpcomingAppointments();
      setUpcomingAppointments(upcomingResponse.data || []);
      
      // Load appointment stats
      const statsResponse = await appointmentService.getAppointmentStats();
      setStats(statsResponse.data || {});
      
      // Load recent appointments
      const recentResponse = await appointmentService.getAppointments({ 
        limit: 5,
        sort: '-createdAt'
      });
      setAppointments(recentResponse.data || []);
      
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

  const handleBookAppointment = () => {
    navigate('/book-appointment');
  };

  const handleViewAllAppointments = () => {
    navigate('/my-appointments');
  };

  const handleViewMedicalRecords = () => {
    navigate('/my-medical-records');
  };

  const handleFindDoctors = () => {
    navigate('/doctors');
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

  return (
    <Container maxWidth="xl" className="page-container">
      {/* Welcome Section */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
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
                {getWelcomeMessage()}, {user.firstName}!
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Ready to take care of your health today?
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            size="large"
            onClick={handleBookAppointment}
            startIcon={<Add />}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              backdropFilter: 'blur(10px)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
            }}
          >
            Book Appointment
          </Button>
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
                        {upcomingAppointments.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Upcoming Appointments
                      </Typography>
                    </Box>
                    <Schedule color="primary" sx={{ fontSize: 40, opacity: 0.7 }} />
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
                        {stats.statusCounts?.find(s => s._id === 'completed')?.count || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completed Visits
                      </Typography>
                    </Box>
                    <Assessment color="success" sx={{ fontSize: 40, opacity: 0.7 }} />
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
                        {stats.todayCount || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Today's Appointments
                      </Typography>
                    </Box>
                    <CalendarToday color="info" sx={{ fontSize: 40, opacity: 0.7 }} />
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
                        {stats.statusCounts?.find(s => s._id === 'pending')?.count || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pending Approval
                      </Typography>
                    </Box>
                    <NotificationsActive color="warning" sx={{ fontSize: 40, opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Upcoming Appointments */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Upcoming Appointments</Typography>
                <Button 
                  size="small" 
                  onClick={handleViewAllAppointments}
                  endIcon={<Schedule />}
                >
                  View All
                </Button>
              </Box>
              
              {upcomingAppointments.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Schedule sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No upcoming appointments
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Schedule your next visit with a healthcare professional
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleBookAppointment}
                    startIcon={<Add />}
                  >
                    Book New Appointment
                  </Button>
                </Box>
              ) : (
                upcomingAppointments.slice(0, 3).map((appointment) => (
                  <AppointmentCard
                    key={appointment._id}
                    appointment={appointment}
                    onViewDetails={(apt) => navigate(`/appointment/${apt._id}`)}
                    showActions={false}
                  />
                ))
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
                  startIcon={<LocalHospital />}
                  onClick={handleFindDoctors}
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  Find Doctors
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Schedule />}
                  onClick={handleViewAllAppointments}
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  My Appointments
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

          {/* Health Tips */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Health Tips
              </Typography>
              
              <Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  💧 Stay hydrated - drink at least 8 glasses of water daily
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  🚶‍♀️ Take regular walks - aim for 30 minutes of exercise daily
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  😴 Get quality sleep - 7-9 hours per night is recommended
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  🥗 Eat balanced meals with plenty of fruits and vegetables
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Activity</Typography>
                <Button 
                  size="small" 
                  onClick={handleViewAllAppointments}
                >
                  View All
                </Button>
              </Box>
              
              {appointments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No recent activity
                </Typography>
              ) : (
                appointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment._id}
                    appointment={appointment}
                    onViewDetails={(apt) => navigate(`/appointment/${apt._id}`)}
                    showActions={false}
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

export default PatientDashboard;
