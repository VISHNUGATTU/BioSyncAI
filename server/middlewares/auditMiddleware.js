import AuditLog from '../models/AuditLog.js';

export const auditLogger = (targetModel) => {
  return async (req, res, next) => {
    
    // res.on('finish') ensures we only log successful actions, not failed attempts
    res.on('finish', async () => {
      // Only log if the request was successful (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        
        let actorModel = 'System';
        let actorId = null;

        // Identify who is making the request using your existing auth middlewares
        if (req.admin) { 
          actorModel = 'Admin'; 
          actorId = req.admin._id; 
        } else if (req.labAssistant) { 
          actorModel = 'LabAssistant'; 
          actorId = req.labAssistant._id; 
        } else if (req.user) { 
          actorModel = 'User'; 
          actorId = req.user._id; 
        }

        // If we can't identify the actor, skip logging
        if (!actorId) return;

        // Map HTTP Methods to exact Actions
        let action = 'Viewed'; // Default for GET
        if (req.method === 'POST') action = 'Created';
        if (req.method === 'PUT' || req.method === 'PATCH') action = 'Updated';
        if (req.method === 'DELETE') action = 'Deleted';

        // Extract the ID of the document being manipulated (if passed in the URL)
        // Fallback to the actor's own ID if they are updating their own profile
        const targetId = req.params.id || actorId; 

        try {
          await AuditLog.create({
            actorModel,
            actorId,
            action,
            targetModel,
            targetId,
            details: `${req.method} request successfully executed on ${req.originalUrl}`,
            ipAddress: req.ip || req.connection.remoteAddress
          });
        } catch (err) {
          console.error("Critical: Failed to save Audit Log:", err.message);
        }
      }
    });

    next();
  };
};