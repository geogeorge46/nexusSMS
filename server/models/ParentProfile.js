import mongoose from 'mongoose'

const parentProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    phone: { type: String, trim: true, default: '' },
    relationship: { type: String, trim: true, default: 'Guardian' },
    linkedStudentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student', index: true }],
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
  },
  { timestamps: true },
)

parentProfileSchema.index({ name: 'text', email: 'text', phone: 'text' })

export const ParentProfile = mongoose.model('ParentProfile', parentProfileSchema)
