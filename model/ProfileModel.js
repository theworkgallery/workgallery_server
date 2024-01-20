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
    default: () => Date.now(),
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
    return 'Ongoing';
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
    required: true,
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
    required: true,
  },
});
const profileSchema = new Schema({
  linkedInUserName: {
    type: String,
    default: false,
  },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  githubUserName: {
    type: String,
    default: false,
  },
  mediumUserName: {
    type: String,
    default: false,
  },
  figmaUserName: {
    type: String,
    default: false,
  },
  picture: {
    type: String,
    default:
      'https://res.cloudinary.com/dcduqfohf/image/upload/v1665506783/7309681_tftx0n.jpg',
  },
  education: [educationSchema],
  experience: [experienceSchema],
  skills: [skillsSchema],
  projects: [projectsSchema],
  certifications: [certificationsSchema],
  achievements: [achievementsSchema],
  about: {
    type: String,
    default: false,
  },
  headline: {
    type: String,
    default: false,
  },
  location: {
    type: String,
    default: false,
  },
  behanceUserName: {
    type: String,
    default: false,
  },
  languages: [languageSchema],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

module.exports = mongoose.model('profileDb', profileSchema);
