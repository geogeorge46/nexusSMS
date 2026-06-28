import mongoose from 'mongoose'

const feeStructureItemSchema = new mongoose.Schema(
  {
    feeCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeCategory', required: true },
    amount: { type: Number, required: true, min: 0 },
    isOptional: { type: Boolean, default: false },
  },
  { _id: false },
)

const feeStructureSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true, index: true },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true, index: true },
    items: {
      type: [feeStructureItemSchema],
      validate: {
        validator(items) {
          return Array.isArray(items) && items.length > 0
        },
        message: 'At least one fee item is required',
      },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
  },
  { timestamps: true },
)

feeStructureSchema.index({ programId: 1, academicYearId: 1, semesterId: 1 }, { unique: true })
feeStructureSchema.index({ name: 'text' })

export const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema)
