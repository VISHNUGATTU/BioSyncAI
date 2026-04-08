// Catch-all for routes that do not exist (404)
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Passes the error down to the errorHandler below
};

// Global Error Handler
// Note: Express specifically looks for exactly 4 arguments (err, req, res, next) to recognize this as an error handler!
export const errorHandler = (err, req, res, next) => {
  // If the status code is still 200, force it to 500 (Server Error)
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose "Bad ObjectId" Error Catch
  // If someone passes a fake ID like /api/users/123, Mongoose throws a CastError.
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found. Invalid ID format.';
  }

  res.status(statusCode).json({
    message: message,
    // SECURITY: Only show the detailed stack trace in development mode
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};