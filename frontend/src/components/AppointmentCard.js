import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Schedule,
  Person,
  LocalHospital,
  Edit,
  Cancel,
  CheckCircle,
  Info,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const AppointmentCard = ({
  appointment,
  onEdit,
  onCancel,
  onConfirm,
  onViewDetails,
  showActions = true,
}) => {
  const { user } = useAuth();

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'no-show':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  const formatDate = (date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const canCancel = () => {
    const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
    const now = new Date();
    const timeDiff = appointmentDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return hoursDiff > 2 && ['pending', 'confirmed'].includes(appointment.status);
  };

  const canConfirm = () => {
    return user.role === 'doctor' && appointment.status === 'pending';
  };

  const canEdit = () => {
    return ['pending', 'confirmed'].includes(appointment.status);
  };

  return (
    <Card sx={{ mb: 2, '&:hover': { boxShadow: 4 } }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              src={
                user.role === 'patient'
                  ? appointment.doctor?.user?.profileImage
                  : appointment.patient?.profileImage
              }
              sx={{ bgcolor: 'primary.main' }}
            >
              {user.role === 'patient'
                ? appointment.doctor?.user?.firstName?.charAt(0)
                : appointment.patient?.firstName?.charAt(0)
              }
            </Avatar>
            <Box>
              <Typography variant="h6" component="div">
                {user.role === 'patient'
                  ? `Dr. ${appointment.doctor?.user?.firstName} ${appointment.doctor?.user?.lastName}`
                  : `${appointment.patient?.firstName} ${appointment.patient?.lastName}`
                }
              </Typography>
              {user.role === 'patient' && (
                <Typography variant="body2" color="text.secondary">
                  {appointment.doctor?.specialization}
                </Typography>
              )}
            </Box>
          </Box>
          
          <Chip
            label={getStatusText(appointment.status)}
            color={getStatusColor(appointment.status)}
            size="small"
          />
        </Box>

        <Box display="flex" alignItems="center" gap={3} mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Schedule fontSize="small" color="action" />
            <Typography variant="body2">
              {formatDate(appointment.appointmentDate)} at {formatTime(appointment.appointmentTime)}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Info fontSize="small" color="action" />
            <Typography variant="body2" textTransform="capitalize">
              {appointment.type}
            </Typography>
          </Box>
        </Box>

        {appointment.symptoms && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              <strong>Symptoms:</strong> {appointment.symptoms}
            </Typography>
          </Box>
        )}

        {appointment.notes?.patient && user.role === 'doctor' && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              <strong>Patient Notes:</strong> {appointment.notes.patient}
            </Typography>
          </Box>
        )}

        {appointment.notes?.doctor && user.role === 'patient' && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              <strong>Doctor Notes:</strong> {appointment.notes.doctor}
            </Typography>
          </Box>
        )}

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            Fee: ${appointment.fee?.amount} 
            {appointment.fee?.paid && (
              <Chip label="Paid" color="success" size="small" sx={{ ml: 1 }} />
            )}
          </Typography>

          {showActions && (
            <Box display="flex" gap={1}>
              <Tooltip title="View Details">
                <IconButton size="small" onClick={() => onViewDetails?.(appointment)}>
                  <Info />
                </IconButton>
              </Tooltip>

              {canEdit() && onEdit && (
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => onEdit(appointment)}>
                    <Edit />
                  </IconButton>
                </Tooltip>
              )}

              {canConfirm() && onConfirm && (
                <Tooltip title="Confirm">
                  <IconButton size="small" color="primary" onClick={() => onConfirm(appointment)}>
                    <CheckCircle />
                  </IconButton>
                </Tooltip>
              )}

              {canCancel() && onCancel && (
                <Tooltip title="Cancel">
                  <IconButton size="small" color="error" onClick={() => onCancel(appointment)}>
                    <Cancel />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AppointmentCard;
