import mongoose from 'mongoose'

const programSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    level: { type: String, trim: true, default: 'Undergraduate' },
    durationSemesters: { type: Number, required: true, min: 1, max: 16 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
  },
  { timestamps: true },
)

programSchema.index({ departmentId: 1, name: 1 }, { unique: true })
programSchema.index({ name: 'text', code: 'text' })

export const Program = mongoose.model('Program', programSchema)
