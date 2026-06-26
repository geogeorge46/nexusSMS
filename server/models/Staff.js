import mongoose from 'mongoose'

const staffSchema = new mongoose.Schema(
  {
    employeeNumber: { type: String, required: true, trim: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    phone: { type: String, trim: true, default: '' },
    category: { type: String, enum: ['Teaching', 'Non-Teaching'], required: true, index: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, sparse: true },
    designation: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
  },
  { timestamps: true },
)

staffSchema.index({ name: 'text', email: 'text', employeeNumber: 'text' })

export const Staff = mongoose.model('Staff', staffSchema)
