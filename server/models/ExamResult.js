import mongoose from 'mongoose'

const examResultSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamSchedule', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    marksObtained: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true, min: 1 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    gradeLetter: { type: String, required: true, trim: true },
    resultStatus: { type: String, enum: ['Pass', 'Fail', 'Absent', 'Withheld'], required: true, index: true },
    remarks: { type: String, trim: true, default: '' },
    publishedAt: { type: Date, index: true },
    createdBy: {
      userId: { type: String, trim: true, default: '' },
      name: { type: String, trim: true, default: '' },
      role: { type: String, trim: true, default: '' },
    },
  },
  { timestamps: true },
)

examResultSchema.index({ examId: 1, scheduleId: 1, studentId: 1 }, { unique: true })

export const ExamResult = mongoose.model('ExamResult', examResultSchema)
