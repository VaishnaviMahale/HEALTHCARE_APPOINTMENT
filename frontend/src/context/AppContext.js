import React, { createContext, useContext, useReducer } from 'react';

const AppContext = createContext();

// Initial state
const initialState = {
  sidebarOpen: false,
  notifications: [],
  theme: 'light',
  loading: false,
  appointments: [],
  doctors: [],
  patients: [],
  medicalRecords: [],
  filters: {
    appointments: {
      status: 'all',
      dateRange: null,
      doctorId: null,
    },
    doctors: {
      specialization: 'all',
      rating: 0,
      availability: 'all',
    },
  },
};

// Action types
const APP_ACTIONS = {
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_SIDEBAR: 'SET_SIDEBAR',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
  SET_THEME: 'SET_THEME',
  SET_LOADING: 'SET_LOADING',
  SET_APPOINTMENTS: 'SET_APPOINTMENTS',
  ADD_APPOINTMENT: 'ADD_APPOINTMENT',
  UPDATE_APPOINTMENT: 'UPDATE_APPOINTMENT',
  REMOVE_APPOINTMENT: 'REMOVE_APPOINTMENT',
  SET_DOCTORS: 'SET_DOCTORS',
  SET_PATIENTS: 'SET_PATIENTS',
  SET_MEDICAL_RECORDS: 'SET_MEDICAL_RECORDS',
  ADD_MEDICAL_RECORD: 'ADD_MEDICAL_RECORD',
  UPDATE_MEDICAL_RECORD: 'UPDATE_MEDICAL_RECORD',
  SET_FILTER: 'SET_FILTER',
  RESET_FILTERS: 'RESET_FILTERS',
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case APP_ACTIONS.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen,
      };

    case APP_ACTIONS.SET_SIDEBAR:
      return {
        ...state,
        sidebarOpen: action.payload,
      };

    case APP_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };

    case APP_ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload
        ),
      };

    case APP_ACTIONS.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
      };

    case APP_ACTIONS.SET_THEME:
      return {
        ...state,
        theme: action.payload,
      };

    case APP_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case APP_ACTIONS.SET_APPOINTMENTS:
      return {
        ...state,
        appointments: action.payload,
      };

    case APP_ACTIONS.ADD_APPOINTMENT:
      return {
        ...state,
        appointments: [...state.appointments, action.payload],
      };

    case APP_ACTIONS.UPDATE_APPOINTMENT:
      return {
        ...state,
        appointments: state.appointments.map((appointment) =>
          appointment.id === action.payload.id ? action.payload : appointment
        ),
      };

    case APP_ACTIONS.REMOVE_APPOINTMENT:
      return {
        ...state,
        appointments: state.appointments.filter(
          (appointment) => appointment.id !== action.payload
        ),
      };

    case APP_ACTIONS.SET_DOCTORS:
      return {
        ...state,
        doctors: action.payload,
      };

    case APP_ACTIONS.SET_PATIENTS:
      return {
        ...state,
        patients: action.payload,
      };

    case APP_ACTIONS.SET_MEDICAL_RECORDS:
      return {
        ...state,
        medicalRecords: action.payload,
      };

    case APP_ACTIONS.ADD_MEDICAL_RECORD:
      return {
        ...state,
        medicalRecords: [...state.medicalRecords, action.payload],
      };

    case APP_ACTIONS.UPDATE_MEDICAL_RECORD:
      return {
        ...state,
        medicalRecords: state.medicalRecords.map((record) =>
          record.id === action.payload.id ? action.payload : record
        ),
      };

    case APP_ACTIONS.SET_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.type]: {
            ...state.filters[action.payload.type],
            [action.payload.key]: action.payload.value,
          },
        },
      };

    case APP_ACTIONS.RESET_FILTERS:
      return {
        ...state,
        filters: initialState.filters,
      };

    default:
      return state;
  }
};

// AppProvider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Sidebar actions
  const toggleSidebar = () => {
    dispatch({ type: APP_ACTIONS.TOGGLE_SIDEBAR });
  };

  const setSidebar = (open) => {
    dispatch({ type: APP_ACTIONS.SET_SIDEBAR, payload: open });
  };

  // Notification actions
  const addNotification = (notification) => {
    const id = Date.now().toString();
    dispatch({
      type: APP_ACTIONS.ADD_NOTIFICATION,
      payload: { ...notification, id },
    });

    // Auto remove notification after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    dispatch({ type: APP_ACTIONS.REMOVE_NOTIFICATION, payload: id });
  };

  const clearNotifications = () => {
    dispatch({ type: APP_ACTIONS.CLEAR_NOTIFICATIONS });
  };

  // Theme actions
  const setTheme = (theme) => {
    dispatch({ type: APP_ACTIONS.SET_THEME, payload: theme });
    localStorage.setItem('theme', theme);
  };

  // Loading actions
  const setLoading = (loading) => {
    dispatch({ type: APP_ACTIONS.SET_LOADING, payload: loading });
  };

  // Appointments actions
  const setAppointments = (appointments) => {
    dispatch({ type: APP_ACTIONS.SET_APPOINTMENTS, payload: appointments });
  };

  const addAppointment = (appointment) => {
    dispatch({ type: APP_ACTIONS.ADD_APPOINTMENT, payload: appointment });
  };

  const updateAppointment = (appointment) => {
    dispatch({ type: APP_ACTIONS.UPDATE_APPOINTMENT, payload: appointment });
  };

  const removeAppointment = (appointmentId) => {
    dispatch({ type: APP_ACTIONS.REMOVE_APPOINTMENT, payload: appointmentId });
  };

  // Doctors actions
  const setDoctors = (doctors) => {
    dispatch({ type: APP_ACTIONS.SET_DOCTORS, payload: doctors });
  };

  // Patients actions
  const setPatients = (patients) => {
    dispatch({ type: APP_ACTIONS.SET_PATIENTS, payload: patients });
  };

  // Medical records actions
  const setMedicalRecords = (records) => {
    dispatch({ type: APP_ACTIONS.SET_MEDICAL_RECORDS, payload: records });
  };

  const addMedicalRecord = (record) => {
    dispatch({ type: APP_ACTIONS.ADD_MEDICAL_RECORD, payload: record });
  };

  const updateMedicalRecord = (record) => {
    dispatch({ type: APP_ACTIONS.UPDATE_MEDICAL_RECORD, payload: record });
  };

  // Filter actions
  const setFilter = (type, key, value) => {
    dispatch({
      type: APP_ACTIONS.SET_FILTER,
      payload: { type, key, value },
    });
  };

  const resetFilters = () => {
    dispatch({ type: APP_ACTIONS.RESET_FILTERS });
  };

  // Get filtered data
  const getFilteredAppointments = () => {
    let filtered = state.appointments;
    const filters = state.filters.appointments;

    if (filters.status !== 'all') {
      filtered = filtered.filter((appointment) => appointment.status === filters.status);
    }

    if (filters.doctorId) {
      filtered = filtered.filter((appointment) => appointment.doctor.id === filters.doctorId);
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filtered = filtered.filter((appointment) => {
        const appointmentDate = new Date(appointment.appointmentDate);
        return appointmentDate >= start && appointmentDate <= end;
      });
    }

    return filtered;
  };

  const getFilteredDoctors = () => {
    let filtered = state.doctors;
    const filters = state.filters.doctors;

    if (filters.specialization !== 'all') {
      filtered = filtered.filter((doctor) => doctor.specialization === filters.specialization);
    }

    if (filters.rating > 0) {
      filtered = filtered.filter((doctor) => doctor.rating.average >= filters.rating);
    }

    return filtered;
  };

  const value = {
    // State
    ...state,
    
    // Actions
    toggleSidebar,
    setSidebar,
    addNotification,
    removeNotification,
    clearNotifications,
    setTheme,
    setLoading,
    setAppointments,
    addAppointment,
    updateAppointment,
    removeAppointment,
    setDoctors,
    setPatients,
    setMedicalRecords,
    addMedicalRecord,
    updateMedicalRecord,
    setFilter,
    resetFilters,
    getFilteredAppointments,
    getFilteredDoctors,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
