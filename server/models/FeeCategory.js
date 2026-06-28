import mongoose from 'mongoose'

const feeCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
  },
  { timestamps: true },
)

feeCategorySchema.index({ name: 1 }, { unique: true, partialFilterExpression: { status: 'Active' } })
feeCategorySchema.index({ name: 'text', description: 'text' })

export const FeeCategory = mongoose.model('FeeCategory', feeCategorySchema)
