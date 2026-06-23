import mongoose from 'mongoose'

const categories = [
  'Identity',
  'Academic',
  'Financial',
  'Medical',
  'Consent',
  'Transfer',
  'Other',
]

const studentDocumentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      index: true,
    },
    studentName: { type: String, trim: true, default: '' },
    registerNumber: { type: String, trim: true, index: true, default: '' },
    category: {
      type: String,
      enum: categories,
      default: 'Other',
      index: true,
    },
    title: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 0 },
    cloudinaryPublicId: { type: String, required: true, trim: true },
    cloudinaryAssetId: { type: String, required: true, trim: true },
    resourceType: { type: String, required: true, enum: ['image', 'raw'], default: 'raw' },
    secureUrl: { type: String, required: true, trim: true },
    downloadUrl: { type: String, required: true, trim: true },
    checksum: { type: String, required: true, trim: true, index: true },
    scanStatus: {
      type: String,
      enum: ['queued', 'passed', 'failed'],
      default: 'passed',
      index: true,
    },
    uploadedBy: { type: String, trim: true, default: 'Nexus Admin' },
  },
  { timestamps: true },
)

studentDocumentSchema.index({ registerNumber: 1, category: 1, createdAt: -1 })

export const documentCategories = categories
export const StudentDocument = mongoose.model('StudentDocument', studentDocumentSchema)
