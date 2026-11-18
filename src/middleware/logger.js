function requestLogger(req, res, next) {
  const start = Date.now();
  const timestamp = new Date().toLocaleTimeString();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
    const reset = '\x1b[0m';
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl || req.url} ${color}${status}${reset} - ${duration}ms`);
  });

  next();
}

module.exports = requestLogger;
