import mongoose from 'mongoose'

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    roomNumber: { type: String, required: true, trim: true, unique: true, index: true },
    building: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    type: {
      type: String,
      enum: ['Classroom', 'Lab', 'Seminar Hall', 'Auditorium', 'Other'],
      default: 'Classroom',
      index: true,
    },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
  },
  { timestamps: true },
)

roomSchema.index({ name: 'text', roomNumber: 'text', building: 'text' })

export const Room = mongoose.model('Room', roomSchema)
