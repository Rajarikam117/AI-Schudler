export function notFound(req, res) { res.status(404).json({ error: 'Not found', message: `No route for ${req.method} ${req.path}` }); }
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = Number.isInteger(err.status) ? err.status : 500;
  if (status >= 500) console.error(`[${new Date().toISOString()}] ${err.message}`);
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : 'Request error', message: status >= 500 ? (err.publicMessage || 'Something went wrong. Check the server logs.') : err.message });
}
export function httpError(status, message, publicMessage) { const e = new Error(message); e.status = status; if (publicMessage) e.publicMessage = publicMessage; return e; }
