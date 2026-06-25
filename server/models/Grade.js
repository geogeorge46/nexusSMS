import mongoose from 'mongoose'

const gradeSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    assessmentType: { type: String, required: true, trim: true, index: true },
    marksObtained: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true, min: 1 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    gradeLetter: { type: String, required: true, trim: true, index: true },
    semester: { type: String, required: true, trim: true, index: true },
    remarks: { type: String, trim: true, default: '' },
    createdBy: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, enum: ['Admin', 'Super Admin'], required: true },
    },
  },
  { timestamps: true },
)

gradeSchema.index({ studentId: 1, courseId: 1, assessmentType: 1, semester: 1 }, { unique: true })

export const Grade = mongoose.model('Grade', gradeSchema)
