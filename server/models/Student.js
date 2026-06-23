import mongoose from 'mongoose'

const studentSchema = new mongoose.Schema(
  {
    registerNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    program: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['Active', 'Pending', 'Review', 'Inactive'],
      default: 'Pending',
    },
    attendance: { type: Number, min: 0, max: 100, default: 0 },
    gpa: { type: Number, min: 0, max: 4, default: 0 },
    advisor: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    enrolledAt: { type: Date, required: true },
  },
  { timestamps: true },
)

export const Student = mongoose.model('Student', studentSchema)
