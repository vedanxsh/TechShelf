function errorHandler(err, req, res, next) {
  console.error(`[Error] ${err.message}`, err.stack ? `\n${err.stack}` : '');

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    error: message,
    statusCode
  });
}

module.exports = errorHandler;
