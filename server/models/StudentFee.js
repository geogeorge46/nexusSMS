import mongoose from 'mongoose'

const studentFeeSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    feeStructureId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeStructure', required: true, index: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true, index: true },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true, index: true },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0, default: 0 },
    dueAmount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Waived', 'Cancelled'],
      default: 'Unpaid',
      index: true,
    },
    assignedBy: {
      userId: { type: String, trim: true, default: '' },
      name: { type: String, trim: true, default: '' },
      role: { type: String, trim: true, default: '' },
    },
  },
  { timestamps: true },
)

studentFeeSchema.index({ studentId: 1, feeStructureId: 1 }, { unique: true })
studentFeeSchema.index({ status: 1, dueDate: 1 })

export const StudentFee = mongoose.model('StudentFee', studentFeeSchema)
