import mongoose from 'mongoose'

const feePaymentSchema = new mongoose.Schema(
  {
    studentFeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentFee', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    method: { type: String, enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Online'], required: true },
    transactionId: { type: String, trim: true },
    paidAt: { type: Date, default: Date.now, index: true },
    receivedBy: {
      userId: { type: String, trim: true, default: '' },
      name: { type: String, trim: true, default: '' },
      role: { type: String, trim: true, default: '' },
    },
    remarks: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
)

feePaymentSchema.index(
  { transactionId: 1 },
  { unique: true, partialFilterExpression: { transactionId: { $exists: true, $gt: '' } } },
)

export const FeePayment = mongoose.model('FeePayment', feePaymentSchema)
