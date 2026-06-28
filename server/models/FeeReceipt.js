import mongoose from 'mongoose'

const feeReceiptSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, required: true, unique: true, trim: true, index: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeePayment', required: true, unique: true, index: true },
    studentFeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentFee', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    issuedAt: { type: Date, default: Date.now, index: true },
    issuedBy: {
      userId: { type: String, trim: true, default: '' },
      name: { type: String, trim: true, default: '' },
      role: { type: String, trim: true, default: '' },
    },
  },
  { timestamps: true },
)

export const FeeReceipt = mongoose.model('FeeReceipt', feeReceiptSchema)
