import mongoose from 'mongoose'

const semesterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    number: { type: Number, required: true, min: 1, max: 16 },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
  },
  { timestamps: true },
)

semesterSchema.index({ academicYearId: 1, number: 1 }, { unique: true })
semesterSchema.index({ academicYearId: 1, name: 1 }, { unique: true })

semesterSchema.pre('validate', function validateDates(next) {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    next(new Error('Semester start date must be before end date'))
    return
  }

  next()
})

export const Semester = mongoose.model('Semester', semesterSchema)
