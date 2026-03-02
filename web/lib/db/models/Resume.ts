import mongoose, { Schema } from "mongoose";

const ResumeSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  targetRole: String, // Context used for AI generation
  
  // This structure matches Profile but contains AI-Optimized text
  content: {
    personalInfo: Object,
    experience: Array, // AI rewritten bullets live here
    projects: Array,
    education: Array,
    skills: [String]
  },
  
  templateId: { type: String, required: true }, // e.g., "harvard_classic"
  pdfUrl: String, // S3 URL (or local path for dev)
  
  createdAt: { type: Date, default: Date.now }
});

export const Resume = mongoose.models.Resume || mongoose.model("Resume", ResumeSchema);
