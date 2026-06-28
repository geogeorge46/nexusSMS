import mongoose from 'mongoose'

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true, index: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true, index: true },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true, index: true },
    dueDate: { type: Date, required: true, index: true },
    maxMarks: { type: Number, required: true, min: 1 },
    attachmentUrl: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['Draft', 'Published', 'Closed', 'Cancelled'], default: 'Draft', index: true },
    createdBy: {
      userId: { type: String, trim: true, default: '' },
      name: { type: String, trim: true, default: '' },
      role: { type: String, trim: true, default: '' },
    },
  },
  { timestamps: true },
)

assignmentSchema.index({ title: 'text', description: 'text' })
assignmentSchema.index({ courseId: 1, title: 1, dueDate: 1 }, { unique: true })

export const Assignment = mongoose.model('Assignment', assignmentSchema)
