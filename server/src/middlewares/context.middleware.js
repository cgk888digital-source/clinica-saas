const context = require('../utils/context');

/**
 * Request Context Middleware
 * Must be executed AFTER auth/verifyToken
 */
const contextMiddleware = (req, res, next) => {
  const data = {
    userId: req.user?.id || null,
    organizationId: req.user?.organizationId || null,
    role: req.user?.role || null,
    requestId: req.get('x-request-id') || null,
    ip: req.ip,
    userAgent: req.get('user-agent') || 'system'
  };

  context.storage.run(data, () => {
    next();
  });
};

module.exports = contextMiddleware;
