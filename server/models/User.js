import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    role: {
      type: String,
      enum: ['Admin', 'Super Admin'],
      default: 'Admin',
      index: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Suspended'],
      default: 'Active',
      index: true,
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
)

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash
    delete ret.passwordSalt
    return ret
  },
})

export const User = mongoose.model('User', userSchema)
