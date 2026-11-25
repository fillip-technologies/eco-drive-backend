import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: 'Admin' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    lastLoginAt: { type: Date },
    // Tokens issued before this moment are rejected (logs out other sessions)
    passwordChangedAt: { type: Date },
  },
  { timestamps: true }
)

adminSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
  // 1s back-dated so a token signed right after the change is still accepted
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000)
})

// JWT `iat` is in seconds
adminSchema.methods.changedPasswordAfter = function (tokenIssuedAt) {
  return Boolean(this.passwordChangedAt) && tokenIssuedAt * 1000 < this.passwordChangedAt.getTime()
}

adminSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

export default mongoose.model('Admin', adminSchema)
