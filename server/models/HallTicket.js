import mongoose from 'mongoose'

const hallTicketSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    hallTicketNumber: { type: String, required: true, unique: true, trim: true, index: true },
    eligibleCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    blockedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    status: { type: String, enum: ['Generated', 'Blocked', 'Cancelled'], default: 'Generated', index: true },
    reason: { type: String, trim: true, default: '' },
    generatedAt: { type: Date, default: Date.now },
    generatedBy: {
      userId: { type: String, trim: true, default: '' },
      name: { type: String, trim: true, default: '' },
      role: { type: String, trim: true, default: '' },
    },
  },
  { timestamps: true },
)

hallTicketSchema.index({ studentId: 1, examId: 1 }, { unique: true })

export const HallTicket = mongoose.model('HallTicket', hallTicketSchema)
