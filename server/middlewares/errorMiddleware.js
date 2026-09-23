import SystemLog from '../models/SystemLog.js';

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Normalize Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.message = 'Resource not found';
    statusCode = 404;
  }

  // Normalize Mongoose duplicate key
  if (err.code === 11000) {
    error.message = 'Duplicate field value entered';
    statusCode = 400;
  }

  // Normalize Mongoose validation error
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map(val => val.message).join(', ');
    statusCode = 400;
  }

  const finalMessage = error.message || 'Internal Server Error';

  if (statusCode === 500) {
    SystemLog.create({
      level: 'ERROR',
      module: 'GlobalErrorHandler',
      message: finalMessage,
      stackTrace: err.stack,
      endpointCalled: req.originalUrl,
      method: req.method,
      ipAddress: req.ip || req.connection?.remoteAddress,
    }).catch((logError) => console.error('Failed to log to SystemLog:', logError));
  }

  res.status(statusCode).json({
    success: false,
    message: finalMessage,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export { errorHandler };