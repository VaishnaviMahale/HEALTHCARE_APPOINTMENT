const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor is required']
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Appointment date must be in the future'
    }
  },
  appointmentTime: {
    type: String,
    required: [true, 'Appointment time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
  },
  duration: {
    type: Number,
    default: 30, // Duration in minutes
    min: [15, 'Minimum appointment duration is 15 minutes'],
    max: [180, 'Maximum appointment duration is 3 hours']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'routine-checkup'],
    default: 'consultation'
  },
  symptoms: {
    type: String,
    maxlength: [500, 'Symptoms description cannot exceed 500 characters']
  },
  notes: {
    patient: {
      type: String,
      maxlength: [500, 'Patient notes cannot exceed 500 characters']
    },
    doctor: {
      type: String,
      maxlength: [1000, 'Doctor notes cannot exceed 1000 characters']
    }
  },
  prescriptions: [{
    medication: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    instructions: String
  }],
  vitalSigns: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number
  },
  diagnosis: {
    type: String,
    maxlength: [1000, 'Diagnosis cannot exceed 1000 characters']
  },
  followUpDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date > this.appointmentDate;
      },
      message: 'Follow-up date must be after the appointment date'
    }
  },
  fee: {
    amount: {
      type: Number,
      required: true,
      min: [0, 'Fee amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD'
    },
    paid: {
      type: Boolean,
      default: false
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'insurance', 'online'],
      default: 'cash'
    }
  },
  remindersSent: {
    oneDayBefore: {
      type: Boolean,
      default: false
    },
    oneHourBefore: {
      type: Boolean,
      default: false
    }
  },
  cancellationReason: {
    type: String,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rescheduledFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for appointment date and time combined
appointmentSchema.virtual('appointmentDateTime').get(function() {
  if (this.appointmentDate && this.appointmentTime) {
    const [hours, minutes] = this.appointmentTime.split(':');
    const dateTime = new Date(this.appointmentDate);
    dateTime.setHours(parseInt(hours), parseInt(minutes));
    return dateTime;
  }
  return null;
});

// Virtual for appointment end time
appointmentSchema.virtual('appointmentEndTime').get(function() {
  if (this.appointmentDateTime) {
    const endTime = new Date(this.appointmentDateTime);
    endTime.setMinutes(endTime.getMinutes() + this.duration);
    return endTime;
  }
  return null;
});

// Method to check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const appointmentTime = this.appointmentDateTime;
  
  // Can't cancel if appointment is in the past or within 2 hours
  if (!appointmentTime || appointmentTime <= now) {
    return false;
  }
  
  const timeDiff = appointmentTime.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  return hoursDiff > 2;
};

// Method to check if appointment can be rescheduled
appointmentSchema.methods.canBeRescheduled = function() {
  return this.status === 'pending' || this.status === 'confirmed';
};

// Static method to find conflicts
appointmentSchema.statics.findConflicts = function(doctorId, date, time, duration, excludeId = null) {
  const query = {
    doctor: doctorId,
    appointmentDate: date,
    status: { $in: ['pending', 'confirmed'] }
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query).then(appointments => {
    const [hours, minutes] = time.split(':');
    const newStart = parseInt(hours) * 60 + parseInt(minutes);
    const newEnd = newStart + duration;
    
    return appointments.filter(apt => {
      const [aptHours, aptMinutes] = apt.appointmentTime.split(':');
      const aptStart = parseInt(aptHours) * 60 + parseInt(aptMinutes);
      const aptEnd = aptStart + apt.duration;
      
      // Check for overlap
      return (newStart < aptEnd && newEnd > aptStart);
    });
  });
};

// Pre-save middleware to validate appointment time conflicts
appointmentSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('appointmentDate') || this.isModified('appointmentTime')) {
    try {
      const conflicts = await this.constructor.findConflicts(
        this.doctor,
        this.appointmentDate,
        this.appointmentTime,
        this.duration,
        this._id
      );
      
      if (conflicts.length > 0) {
        return next(new Error('Appointment time conflicts with existing appointment'));
      }
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

// Compound indexes for better query performance
appointmentSchema.index({ doctor: 1, appointmentDate: 1 });
appointmentSchema.index({ patient: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
