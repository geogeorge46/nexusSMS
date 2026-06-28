import mongoose from 'mongoose'

const learningMaterialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true, index: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true, index: true },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true, index: true },
    materialType: { type: String, enum: ['Notes', 'PDF', 'Video', 'Link', 'Slides', 'Code', 'Other'], default: 'Notes', index: true },
    fileUrl: { type: String, trim: true, default: '' },
    externalUrl: { type: String, trim: true, default: '' },
    visibility: { type: String, enum: ['Draft', 'Published', 'Archived'], default: 'Draft', index: true },
    createdBy: {
      userId: { type: String, trim: true, default: '' },
      name: { type: String, trim: true, default: '' },
      role: { type: String, trim: true, default: '' },
    },
  },
  { timestamps: true },
)

learningMaterialSchema.index({ title: 'text', description: 'text' })

export const LearningMaterial = mongoose.model('LearningMaterial', learningMaterialSchema)
