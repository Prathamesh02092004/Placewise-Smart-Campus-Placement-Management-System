const diff = require('deep-diff');
const logger = require('../utils/logger');

const auditLog = (action, entity) => {
  return (req, res, next) => {
    const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!WRITE_METHODS.includes(req.method)) {
      return next();
    }
    const originalJson = res.json.bind(res);
    let responseBody = null;
    res.json = (body) => {
      responseBody = body;
      return originalJson(body);
    };
    res.on('finish', async () => {
      try {
        if (res.statusCode < 200 || res.statusCode >= 300) return;
        if (!req.user) return; 
        const { AuditLog } = require('../models');
        const entityId =
          req.params.id ||
          responseBody?.data?.id ||
          null;
        const oldValue = req.auditOldValue || null;
        const newValue = responseBody?.data || null;
        const changes = oldValue && newValue
          ? diff(oldValue, newValue) || []
          : null;
        await AuditLog.create({
          user_id: req.user.userId,
          action,
          entity,
          entity_id: entityId,
          old_value: oldValue,
          new_value: newValue,
          diff: changes,
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.headers['user-agent'] || null,
        });
      } catch (err) {
        logger.error('AuditLog write failed:', err.message);
      }
    });

    next();
  };
};

module.exports = { auditLog };