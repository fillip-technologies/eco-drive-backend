import mongoose from 'mongoose'

export const CONTACT_STATUSES = ['new', 'contacted', 'converted', 'closed']
// 'enquiry' = vehicle form (Home, Delivery, Cargo)
// 'contact' = Contact Us page message form
// 'demo'    = "Book Demo" test-ride modal
export const FORM_TYPES = ['enquiry', 'contact', 'demo']

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'],
    },
    formType: { type: String, enum: FORM_TYPES, default: 'enquiry', index: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 200,
      match: [/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'],
      default: '',
    },
    // Required for vehicle enquiries only
    pincode: {
      type: String,
      trim: true,
      maxlength: 120,
      required: [function () { return this.formType === 'enquiry' }, 'Pin code or area is required'],
    },
    model: {
      type: String,
      trim: true,
      maxlength: 100,
      required: [function () { return this.formType !== 'contact' }, 'Model is required'],
    },
    // Required for demo bookings only
    city: {
      type: String,
      trim: true,
      maxlength: 100,
      required: [function () { return this.formType === 'demo' }, 'City is required'],
    },
    subject: { type: String, trim: true, maxlength: 200, default: '' },
    message: { type: String, trim: true, maxlength: 3000, default: '' },
    quantity: { type: Number, min: 1, max: 100000 },
    // Which page the enquiry came from, e.g. "/", "/cargo-150"
    source: { type: String, trim: true, maxlength: 200, default: '' },
    status: { type: String, enum: CONTACT_STATUSES, default: 'new', index: true },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
  },
  { timestamps: true }
)

contactSchema.index({ createdAt: -1 })

export default mongoose.model('Contact', contactSchema)
