import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Badge,
  Tooltip,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  ExitToApp,
  Dashboard,
  Person,
  Settings,
  LocalHospital,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  
  const { user, logout } = useAuth();
  const { notifications, toggleSidebar } = useApp();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  const handleProfile = () => {
    navigate('/profile');
    handleProfileMenuClose();
  };

  const handleDashboard = () => {
    navigate(`/${user.role}-dashboard`);
    handleProfileMenuClose();
  };

  const getMenuItems = () => {
    const items = [
      { text: 'Dashboard', icon: <Dashboard />, onClick: handleDashboard },
      { text: 'Profile', icon: <Person />, onClick: handleProfile },
    ];

    if (user.role === 'patient') {
      items.push(
        { text: 'Find Doctors', icon: <LocalHospital />, onClick: () => navigate('/doctors') },
        { text: 'My Appointments', icon: <Settings />, onClick: () => navigate('/my-appointments') }
      );
    } else if (user.role === 'doctor') {
      items.push(
        { text: 'My Appointments', icon: <Settings />, onClick: () => navigate('/doctor-appointments') },
        { text: 'My Patients', icon: <Person />, onClick: () => navigate('/doctor-patients') }
      );
    }

    return items;
  };

  const renderDesktopMenu = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {user.role === 'patient' && (
        <>
          <Button color="inherit" onClick={() => navigate('/doctors')} startIcon={<LocalHospital />}>
            Find Doctors
          </Button>
          <Button color="inherit" onClick={() => navigate('/my-appointments')}>
            My Appointments
          </Button>
        </>
      )}
      
      {user.role === 'doctor' && (
        <>
          <Button color="inherit" onClick={() => navigate('/doctor-appointments')}>
            Appointments
          </Button>
          <Button color="inherit" onClick={() => navigate('/doctor-patients')}>
            Patients
          </Button>
        </>
      )}

      {/* Notifications */}
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleNotificationMenuOpen}
        >
          <Badge badgeContent={notifications.length} color="error">
            <Notifications />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Profile */}
      <Tooltip title="Account">
        <IconButton
          onClick={handleProfileMenuOpen}
          sx={{ p: 0 }}
        >
          <Avatar
            alt={user.firstName}
            src={user.profileImage}
            sx={{ bgcolor: theme.palette.primary.main }}
          >
            {user.firstName.charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>
      </Tooltip>
    </Box>
  );

  const renderMobileMenu = () => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton
        color="inherit"
        onClick={handleNotificationMenuOpen}
      >
        <Badge badgeContent={notifications.length} color="error">
          <Notifications />
        </Badge>
      </IconButton>

      <IconButton
        onClick={handleProfileMenuOpen}
        sx={{ p: 0, ml: 1 }}
      >
        <Avatar
          alt={user.firstName}
          src={user.profileImage}
          sx={{ bgcolor: theme.palette.primary.main }}
        >
          {user.firstName.charAt(0).toUpperCase()}
        </Avatar>
      </IconButton>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={toggleSidebar}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <LocalHospital sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Healthcare System
          </Typography>

          <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
            Welcome, {user.firstName}
          </Typography>

          {isMobile ? renderMobileMenu() : renderDesktopMenu()}
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
      >
        {getMenuItems().map((item, index) => (
          <MenuItem key={index} onClick={item.onClick}>
            {item.icon}
            <Typography sx={{ ml: 1 }}>{item.text}</Typography>
          </MenuItem>
        ))}
        <MenuItem onClick={handleLogout}>
          <ExitToApp />
          <Typography sx={{ ml: 1 }}>Logout</Typography>
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationMenuClose}
      >
        {notifications.length === 0 ? (
          <MenuItem>
            <Typography variant="body2" color="text.secondary">
              No new notifications
            </Typography>
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem key={notification.id} onClick={handleNotificationMenuClose}>
              <Typography variant="body2">{notification.message}</Typography>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default Navbar;
