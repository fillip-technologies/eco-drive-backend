export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.name === 'ValidationError') {
    // Type-mismatch errors (e.g. an object sent instead of text) get a generic
    // message instead of Mongoose's internal wording
    const errors = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, v.name === 'CastError' ? `Invalid value for ${k}` : v.message])
    )
    return res.status(400).json({ message: Object.values(errors)[0], errors })
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}` })
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body' })
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request is too large' })
  }

  // Client errors (4xx) are expected — only log real server failures
  const status = err.status || err.statusCode || 500
  if (status >= 500) console.error(err)
  res.status(status).json({ message: status < 500 ? err.message : 'Internal server error' })
}
