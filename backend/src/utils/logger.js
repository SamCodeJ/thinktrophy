const { query } = require('../db/connection');

async function logAdminAction({ adminId, action, entity, entityId, details, ipAddress }) {
  try {
    await query(
      `INSERT INTO admin_logs (admin_id, action, entity, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        adminId || null,
        action,
        entity,
        entityId || null,
        details ? JSON.stringify(details) : null,
        ipAddress || null,
      ]
    );
  } catch (err) {
    console.error('Failed to log admin action:', err.message);
  }
}

module.exports = { logAdminAction };