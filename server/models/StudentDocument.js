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
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    studentName: { type: String, trim: true, default: '' },
    registerNumber: { type: String, trim: true, index: true, default: '' },
    documentType: {
      type: String,
      enum: categories,
      default: 'Other',
      index: true,
    },
    title: { type: String, required: true, trim: true },
    fileName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    fileSize: { type: Number, required: true, min: 0 },
    cloudinaryPublicId: { type: String, required: true, trim: true },
    cloudinaryAssetId: { type: String, required: true, trim: true },
    resourceType: { type: String, required: true, enum: ['image', 'raw'], default: 'raw' },
    fileUrl: { type: String, required: true, trim: true },
    downloadUrl: { type: String, required: true, trim: true },
    checksum: { type: String, required: true, trim: true, index: true },
    scanStatus: {
      type: String,
      enum: ['queued', 'passed', 'failed'],
      default: 'passed',
      index: true,
    },
    uploadedBy: { type: String, trim: true, default: 'Nexus Admin' },
    uploadedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
)

studentDocumentSchema.index({ studentId: 1, documentType: 1, uploadedAt: -1 })

export const documentCategories = categories
export const StudentDocument = mongoose.model('StudentDocument', studentDocumentSchema)
