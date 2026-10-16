class AppError extends Error {
  constructor(message, statusCode = 400, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== 'production';
  console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}:`, err.message);

  // PostgreSQL errors
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: { code: 'DUPLICATE_ENTRY', message: 'A record with this value already exists' },
    });
  }
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_REFERENCE', message: 'Referenced record does not exist' },
    });
  }

  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : (err.statusCode || err.status || 500);
  const expose = isAppError || (isDev && statusCode < 500);
  return res.status(statusCode).json({
    success: false,
    error: {
      code:    expose ? (err.code || 'INTERNAL_ERROR') : 'INTERNAL_ERROR',
      message: expose ? (err.message || 'An unexpected error occurred') : 'An unexpected error occurred',
      ...(isDev && { stack: err.stack }),
    },
  });
}

function notFound(req, res) {
  return res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
}

module.exports = { errorHandler, notFound, AppError };
