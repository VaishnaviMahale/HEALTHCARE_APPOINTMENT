import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Avatar,
  Rating,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import {
  LocalHospital,
  Star,
  Schedule,
  Phone,
  Email,
  LocationOn,
} from '@mui/icons-material';

const DoctorCard = ({
  doctor,
  onBookAppointment,
  onViewProfile,
  showBookButton = true,
  compact = false,
}) => {
  const formatAvailability = () => {
    const availableDays = Object.entries(doctor.availability || {})
      .filter(([day, schedule]) => schedule.isAvailable)
      .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1, 3))
      .join(', ');
    
    return availableDays || 'Not specified';
  };

  const getExperienceText = () => {
    const years = doctor.experience;
    return years === 1 ? '1 year' : `${years} years`;
  };

  if (compact) {
    return (
      <Card sx={{ display: 'flex', alignItems: 'center', p: 2, mb: 1 }}>
        <Avatar
          src={doctor.user?.profileImage}
          sx={{ width: 60, height: 60, mr: 2, bgcolor: 'primary.main' }}
        >
          {doctor.user?.firstName?.charAt(0)}
        </Avatar>
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6">
            Dr. {doctor.user?.firstName} {doctor.user?.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {doctor.specialization}
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
            <Rating value={doctor.rating?.average || 0} readOnly size="small" />
            <Typography variant="caption">
              ({doctor.rating?.count || 0} reviews)
            </Typography>
          </Box>
        </Box>
        
        <Box textAlign="right">
          <Typography variant="h6" color="primary">
            ${doctor.consultationFee}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            consultation
          </Typography>
        </Box>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            src={doctor.user?.profileImage}
            sx={{ width: 80, height: 80, mr: 2, bgcolor: 'primary.main' }}
          >
            {doctor.user?.firstName?.charAt(0)}
          </Avatar>
          
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              Dr. {doctor.user?.firstName} {doctor.user?.lastName}
            </Typography>
            
            <Chip
              label={doctor.specialization}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ mb: 1 }}
            />
            
            <Box display="flex" alignItems="center" gap={1}>
              <Rating value={doctor.rating?.average || 0} readOnly size="small" />
              <Typography variant="caption" color="text.secondary">
                ({doctor.rating?.count || 0} reviews)
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Experience:</strong> {getExperienceText()}
          </Typography>
          
          {doctor.hospital?.name && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Hospital:</strong> {doctor.hospital.name}
            </Typography>
          )}
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Available:</strong> {formatAvailability()}
          </Typography>
        </Box>

        {doctor.bio && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            {doctor.bio.substring(0, 150)}
            {doctor.bio.length > 150 && '...'}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" color="primary">
              ${doctor.consultationFee}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              consultation fee
            </Typography>
          </Box>
          
          {doctor.isVerified && (
            <Chip
              label="Verified"
              color="success"
              size="small"
              icon={<LocalHospital />}
            />
          )}
        </Box>

        {doctor.qualifications && doctor.qualifications.length > 0 && (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Qualifications:
            </Typography>
            {doctor.qualifications.slice(0, 2).map((qual, index) => (
              <Typography key={index} variant="caption" sx={{ display: 'block' }}>
                • {qual.degree} from {qual.institution} ({qual.year})
              </Typography>
            ))}
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="outlined"
          onClick={() => onViewProfile?.(doctor)}
          sx={{ mr: 1 }}
        >
          View Profile
        </Button>
        
        {showBookButton && (
          <Button
            variant="contained"
            onClick={() => onBookAppointment?.(doctor)}
            disabled={!doctor.isVerified}
          >
            Book Appointment
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default DoctorCard;
