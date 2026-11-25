import Contact, { CONTACT_STATUSES, FORM_TYPES } from '../models/Contact.js'

// Records saved before formType existed have no value — they are product enquiries
const formTypeFilter = (type) => {
  if (type === 'enquiry') return { formType: { $nin: ['contact', 'demo'] } }
  return FORM_TYPES.includes(type) ? { formType: type } : {}
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// POST /api/contacts  (public)
export async function createContact(req, res) {
  const { name, phone, email, pincode, city, model, quantity, subject, message, source } = req.body || {}
  const formType = FORM_TYPES.includes(req.body?.formType) ? req.body.formType : 'enquiry'

  const contact = await Contact.create({
    name,
    // Accept "+91 98765 43210", "098765..." etc. — keep the last 10 digits
    phone: String(phone || '').replace(/\D/g, '').slice(-10),
    email,
    formType,
    pincode,
    city,
    model,
    subject,
    message,
    quantity: quantity === '' || quantity == null ? undefined : Number(quantity),
    source,
  })

  res.status(201).json({ message: 'Thank you! Our team will contact you shortly.', id: contact._id })
}

// GET /api/contacts?page=1&limit=20&status=new&search=rahul  (admin)
export async function listContacts(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20))
  const filter = {}

  if (req.query.status && CONTACT_STATUSES.includes(req.query.status)) {
    filter.status = req.query.status
  }
  Object.assign(filter, formTypeFilter(req.query.formType))
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search).trim().slice(0, 100)), 'i')
    filter.$or = [
      { name: rx }, { phone: rx }, { email: rx }, { pincode: rx }, { city: rx },
      { model: rx }, { subject: rx }, { message: rx },
    ]
  }

  const [items, total] = await Promise.all([
    Contact.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Contact.countDocuments(filter),
  ])

  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) })
}

// GET /api/contacts/stats?formType=enquiry  (admin)
// Counts for all forms, or for one form type when ?formType is given.
// `byType` always holds per-form totals and "new" counts (used by the sidebar badges).
export async function contactStats(req, res) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const match = formTypeFilter(req.query.formType)

  const [byStatus, total, today, typeRows] = await Promise.all([
    Contact.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Contact.countDocuments(match),
    Contact.countDocuments({ ...match, createdAt: { $gte: startOfToday } }),
    Contact.aggregate([
      {
        $group: {
          _id: '$formType',
          total: { $sum: 1 },
          new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
        },
      },
    ]),
  ])

  const counts = Object.fromEntries(CONTACT_STATUSES.map((s) => [s, 0]))
  byStatus.forEach((row) => { counts[row._id] = row.count })

  const byType = Object.fromEntries(FORM_TYPES.map((t) => [t, { total: 0, new: 0 }]))
  typeRows.forEach(({ _id, total: t, new: n }) => {
    const key = _id || 'enquiry'
    byType[key].total += t
    byType[key].new += n
  })

  res.json({ total, today, ...counts, byType })
}

// PATCH /api/contacts/:id  (admin) — update status / notes
export async function updateContact(req, res) {
  const updates = {}
  if (req.body?.status !== undefined) updates.status = req.body.status
  if (req.body?.notes !== undefined) updates.notes = req.body.notes

  const contact = await Contact.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: 'after',
    runValidators: true,
  })
  if (!contact) return res.status(404).json({ message: 'Enquiry not found' })
  res.json(contact)
}

// DELETE /api/contacts/:id  (admin)
export async function deleteContact(req, res) {
  const contact = await Contact.findByIdAndDelete(req.params.id)
  if (!contact) return res.status(404).json({ message: 'Enquiry not found' })
  res.json({ message: 'Enquiry deleted' })
}
