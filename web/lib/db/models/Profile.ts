import mongoose, { Schema } from "mongoose";

const ProfileSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  
  // Metadata
  isLocked: { type: Boolean, default: false }, // Locks critical Personal Info after first resume generation

  // 1. Personal Info
  personalInfo: {
    fullName: { type: String, required: true }, // Locked
    email: { type: String, required: true }, // Locked
    phone: { type: String, required: true }, // Locked
    location: { type: String, required: true }, // City/Location
    country: { type: String, required: true },
    headline: String,
    photoUrl: String,
    
    // Links
    linkedin: String,
    github: String,
    portfolio: String,
    twitter: String,
    otherLink: String
  },

  // 2. Education
  education: [{
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    fieldOfStudy: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    score: String, // CGPA
    coursework: [String]
  }],

  // 3. Experience (Work History)
  experience: [{
    jobTitle: { type: String, required: true },
    company: { type: String, required: true },
    location: String,
    startDate: { type: String, required: true },
    endDate: String, // Null if current
    isCurrentRole: { type: Boolean, default: false },
    description: String
  }],

  // 4. Projects
  projects: [{
    title: { type: String, required: true },
    role: String,
    techStack: [String],
    link: String,
    description: { type: String, required: true },
    startDate: String,
    endDate: String
  }],

  // 5. Skills (Split)
  skills: {
    technical: [String], // Java, Python
    tools: [String], // Docker, Jira
    soft: [String] // Leadership
  },

  // 6. Achievements / Awards
  achievements: [{
    title: { type: String, required: true },
    organization: String,
    dateReceived: String,
    description: String
  }],

  // 7. Certifications
  certifications: [{
    name: { type: String, required: true },
    organization: { type: String, required: true },
    issueDate: String,
    expirationDate: String,
    credentialUrl: String
  }],

  // 8. Publications
  publications: [{
    title: { type: String, required: true },
    journal: { type: String, required: true },
    date: String,
    link: String,
    description: String
  }]
});

export const Profile = mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);
