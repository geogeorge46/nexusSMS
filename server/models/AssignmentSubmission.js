import mongoose from 'mongoose'

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    submittedAt: { type: Date, default: Date.now, index: true },
    submissionText: { type: String, trim: true, default: '' },
    fileUrl: { type: String, trim: true, default: '' },
    fileName: { type: String, trim: true, default: '' },
    mimeType: { type: String, trim: true, default: '' },
    fileSize: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['Submitted', 'Late', 'Graded', 'Resubmission Requested', 'Rejected'],
      default: 'Submitted',
      index: true,
    },
    marksObtained: { type: Number, min: 0 },
    feedback: { type: String, trim: true, default: '' },
    gradedBy: {
      userId: { type: String, trim: true, default: '' },
      name: { type: String, trim: true, default: '' },
      role: { type: String, trim: true, default: '' },
    },
    gradedAt: { type: Date },
  },
  { timestamps: true },
)

assignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true })

export const AssignmentSubmission = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema)
