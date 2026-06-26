import mongoose from 'mongoose'

const academicYearSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
  },
  { timestamps: true },
)

academicYearSchema.pre('validate', function validateDates(next) {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    next(new Error('Academic year start date must be before end date'))
    return
  }

  next()
})

export const AcademicYear = mongoose.model('AcademicYear', academicYearSchema)
