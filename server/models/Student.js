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
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', index: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', index: true },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', index: true },
    batch: { type: String, trim: true, default: '' },
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
    guardianName: { type: String, trim: true, default: '' },
    guardianPhone: { type: String, trim: true, default: '' },
    emergencyContact: { type: String, trim: true, default: '' },
    bloodGroup: { type: String, trim: true, default: '' },
    profilePhotoUrl: { type: String, trim: true, default: '' },
    skills: [{ type: String, trim: true }],
    achievements: [{ type: String, trim: true }],
    enrolledAt: { type: Date, required: true },
  },
  { timestamps: true },
)

studentSchema.index({ departmentId: 1, programId: 1, semesterId: 1 })

export const Student = mongoose.model('Student', studentSchema)
