import mongoose from 'mongoose'

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    examType: { type: String, enum: ['Internal', 'Midterm', 'Final', 'Practical', 'Supplementary', 'Other'], required: true, index: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true, index: true },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true, index: true },
    status: { type: String, enum: ['Draft', 'Scheduled', 'Ongoing', 'Completed', 'Published', 'Cancelled'], default: 'Draft', index: true },
    createdBy: {
      userId: { type: String, trim: true, default: '' },
      name: { type: String, trim: true, default: '' },
      role: { type: String, trim: true, default: '' },
    },
  },
  { timestamps: true },
)

examSchema.index({ title: 'text', examType: 'text' })
examSchema.index({ title: 1, academicYearId: 1, programId: 1, semesterId: 1 }, { unique: true })

export const Exam = mongoose.model('Exam', examSchema)
