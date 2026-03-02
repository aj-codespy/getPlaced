import mongoose, { Schema } from "mongoose";

// Connection logic moved to lib/db/connect.ts

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // For credentials auth
  image: String, // For OAuth profile pics
  
  // The Identity Lock
  isIdentityLocked: { type: Boolean, default: false },
  
  // Subscription
  subscriptionStatus: { 
    type: String, 
    enum: ["FREE", "ACTIVE", "PAST_DUE"], 
    default: "FREE" 
  },
  credits: { type: Number, default: 1 }, // Starts with 1 free credit
  
  referralCode: { type: String, unique: true },
  referredBy: String,
  
  createdAt: { type: Date, default: Date.now }
});

// Avoid OverwriteModelError
export const User = mongoose.models.User || mongoose.model("User", UserSchema);
