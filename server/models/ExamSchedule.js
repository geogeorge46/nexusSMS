import mongoose from 'mongoose'

const examScheduleSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', index: true },
    maxMarks: { type: Number, required: true, min: 1 },
    passingMarks: { type: Number, required: true, min: 0 },
    invigilators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }],
    status: { type: String, enum: ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'], default: 'Scheduled', index: true },
  },
  { timestamps: true },
)

examScheduleSchema.index({ examId: 1, courseId: 1 }, { unique: true })
examScheduleSchema.index({ roomId: 1, date: 1, startTime: 1, endTime: 1 })

export const ExamSchedule = mongoose.model('ExamSchedule', examScheduleSchema)
