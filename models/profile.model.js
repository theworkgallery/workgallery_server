const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const skillsSchema = new Schema({
  skill: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: false,
  },
});

const educationSchema = new Schema({
  schoolName: {
    type: String,
    required: true,
  },
  grade: {
    type: String,
    required: true,
  },
  degree: {
    type: String,
    required: true,
  },
  fieldOfStudy: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  current: {
    type: Boolean,
    default: false,
  },
  endDate: {
    type: Date,
    required: false,
  },
  skills: [skillsSchema],
  isPublic: {
    type: Boolean,
    default: true,
  },
});

const experienceSchema = new Schema(
  {
    companyName: {
      type: String,
      required: true,
    },
    picture: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      required: true,
    },
    skills: [skillsSchema],
    startDate: {
      type: Date,
      required: true,
    },
    current: {
      type: Boolean,
      default: false,
    },
    endDate: {
      type: Date,
    },
    description: {
      type: String,
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for calculating the duration
experienceSchema.virtual('duration').get(function () {
  if (!this.endDate) {
    return 'Present';
  }

  const start = this.startDate;
  const end = this.endDate;
  const duration = new Date(end - start);
  const years = duration.getUTCFullYear() - 1970; // Years
  const months = duration.getUTCMonth(); // Months

  // Constructing a readable duration format
  let result = '';
  if (years > 0) result += `${years} years `;
  if (months > 0) result += `${months} months`;

  return result.trim();
});

const projectsSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
});

const certificationsSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
});

const achievementsSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: false,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
});
const languageSchema = new Schema({
  language: {
    type: String,
    required: true,
  },
  proficiency: {
    type: String,
    required: false,
  },
});
const profileSchema = new Schema({
  education: [educationSchema],
  experience: [experienceSchema],
  skills: [skillsSchema],
  projects: [projectsSchema],
  certifications: [certificationsSchema],
  achievements: [achievementsSchema],
  languages: [languageSchema],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

module.exports = mongoose.model('Profile', profileSchema);
