const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
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
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'Appointment is required']
  },
  visitDate: {
    type: Date,
    required: [true, 'Visit date is required'],
    default: Date.now
  },
  chiefComplaint: {
    type: String,
    required: [true, 'Chief complaint is required'],
    maxlength: [500, 'Chief complaint cannot exceed 500 characters']
  },
  historyOfPresentIllness: {
    type: String,
    maxlength: [1000, 'History of present illness cannot exceed 1000 characters']
  },
  pastMedicalHistory: {
    conditions: [{
      condition: String,
      diagnosedDate: Date,
      status: {
        type: String,
        enum: ['active', 'resolved', 'chronic'],
        default: 'active'
      }
    }],
    surgeries: [{
      procedure: String,
      date: Date,
      hospital: String,
      notes: String
    }],
    allergies: [{
      allergen: String,
      reaction: String,
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        default: 'mild'
      }
    }],
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      startDate: Date,
      endDate: Date,
      prescribedBy: String
    }]
  },
  familyHistory: [{
    relation: {
      type: String,
      enum: ['father', 'mother', 'sibling', 'grandparent', 'aunt', 'uncle', 'cousin', 'other']
    },
    condition: String,
    notes: String
  }],
  socialHistory: {
    smoking: {
      status: {
        type: String,
        enum: ['never', 'former', 'current'],
        default: 'never'
      },
      packsPerDay: Number,
      yearsSmoked: Number,
      quitDate: Date
    },
    alcohol: {
      status: {
        type: String,
        enum: ['never', 'occasional', 'moderate', 'heavy'],
        default: 'never'
      },
      drinksPerWeek: Number
    },
    exercise: {
      frequency: {
        type: String,
        enum: ['none', 'rarely', 'weekly', 'daily']
      },
      type: String
    },
    occupation: String,
    maritalStatus: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widowed', 'separated']
    }
  },
  physicalExamination: {
    vitalSigns: {
      bloodPressure: {
        systolic: Number,
        diastolic: Number
      },
      heartRate: Number,
      respiratoryRate: Number,
      temperature: Number,
      oxygenSaturation: Number,
      weight: Number,
      height: Number,
      bmi: Number
    },
    generalAppearance: String,
    systemsReview: {
      cardiovascular: String,
      respiratory: String,
      gastrointestinal: String,
      neurological: String,
      musculoskeletal: String,
      dermatological: String,
      other: String
    }
  },
  diagnosticTests: [{
    testName: String,
    testDate: Date,
    results: String,
    normalRange: String,
    interpretation: String,
    fileUrl: String // For storing test report files
  }],
  diagnosis: {
    primary: {
      type: String,
      required: [true, 'Primary diagnosis is required'],
      maxlength: [200, 'Primary diagnosis cannot exceed 200 characters']
    },
    secondary: [{
      condition: String,
      icdCode: String
    }],
    differential: [String]
  },
  treatment: {
    medications: [{
      name: {
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
      instructions: String,
      prescribedDate: {
        type: Date,
        default: Date.now
      }
    }],
    procedures: [{
      name: String,
      date: Date,
      notes: String,
      performedBy: String
    }],
    referrals: [{
      speciality: String,
      doctorName: String,
      reason: String,
      urgency: {
        type: String,
        enum: ['routine', 'urgent', 'emergency'],
        default: 'routine'
      },
      referralDate: {
        type: Date,
        default: Date.now
      }
    }]
  },
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    timeframe: String,
    instructions: String,
    appointmentScheduled: {
      type: Boolean,
      default: false
    }
  },
  additionalNotes: {
    type: String,
    maxlength: [2000, 'Additional notes cannot exceed 2000 characters']
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  isConfidential: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    sharedDate: {
      type: Date,
      default: Date.now
    },
    permissions: {
      type: String,
      enum: ['read', 'read-write'],
      default: 'read'
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for BMI calculation
medicalRecordSchema.virtual('calculatedBMI').get(function() {
  if (this.physicalExamination?.vitalSigns?.weight && this.physicalExamination?.vitalSigns?.height) {
    const weight = this.physicalExamination.vitalSigns.weight; // in kg
    const height = this.physicalExamination.vitalSigns.height / 100; // convert cm to m
    return Math.round((weight / (height * height)) * 10) / 10;
  }
  return null;
});

// Pre-save middleware to calculate BMI
medicalRecordSchema.pre('save', function(next) {
  if (this.physicalExamination?.vitalSigns?.weight && this.physicalExamination?.vitalSigns?.height) {
    this.physicalExamination.vitalSigns.bmi = this.calculatedBMI;
  }
  next();
});

// Static method to get patient's complete medical history
medicalRecordSchema.statics.getPatientHistory = function(patientId) {
  return this.find({ patient: patientId })
    .populate('doctor', 'user specialization')
    .populate('appointment', 'appointmentDate appointmentTime')
    .sort({ visitDate: -1 });
};

// Static method to get records by date range
medicalRecordSchema.statics.getRecordsByDateRange = function(patientId, startDate, endDate) {
  return this.find({
    patient: patientId,
    visitDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ visitDate: -1 });
};

// Method to check if record can be accessed by a doctor
medicalRecordSchema.methods.canBeAccessedBy = function(doctorId) {
  // Original doctor can always access
  if (this.doctor.toString() === doctorId.toString()) {
    return true;
  }
  
  // Check if shared with the doctor
  return this.sharedWith.some(share => 
    share.doctor.toString() === doctorId.toString()
  );
};

// Indexes for better query performance
medicalRecordSchema.index({ patient: 1, visitDate: -1 });
medicalRecordSchema.index({ doctor: 1, visitDate: -1 });
medicalRecordSchema.index({ appointment: 1 });
medicalRecordSchema.index({ 'diagnosis.primary': 'text', 'additionalNotes': 'text' });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
