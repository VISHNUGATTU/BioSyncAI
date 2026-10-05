// A scalable, multi-entity Role-Based Access Control (RBAC) middleware
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. Identify the authenticated entity dynamically
    const entity = req.admin || req.user || req.labAssistant;

    if (!entity) {
      res.status(401);
      throw new Error('Not authorized: Authentication context missing.');
    }

    // 2. Determine the entity's roles with proper precedence
    let userRoles = [];
    
    if (req.admin) {
      if (req.admin.role) {
        userRoles = Array.isArray(req.admin.role) ? req.admin.role : [req.admin.role];
      } else {
        userRoles = ['Admin'];
      }
    } else if (req.labAssistant) {
      if (req.labAssistant.role) {
        userRoles = Array.isArray(req.labAssistant.role) ? req.labAssistant.role : [req.labAssistant.role];
      } else {
        userRoles = ['LabAssistant'];
      }
    } else if (req.user) {
      if (req.user.role) {
        userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
      } else {
        userRoles = ['User'];
      }
    } else if (entity.role) {
      userRoles = Array.isArray(entity.role) ? entity.role : [entity.role];
    }

    // Helper to normalize strings: removes underscores, spaces, hyphens, lowercase
    const normalize = (r) => String(r || '').toLowerCase().replace(/[_\s-]/g, '');

    // 3. SuperAdmin has overarching administrative access
    const isSuperAdmin = userRoles.some(r => normalize(r) === 'superadmin');
    if (isSuperAdmin) {
      return next();
    }

    // 4. Check for intersection between allowed roles and user roles (case-insensitive & format-resilient)
    const hasAccess = userRoles.some(userRole => {
      const normUser = normalize(userRole);
      return allowedRoles.some(allowed => normalize(allowed) === normUser);
    });

    if (!hasAccess) {
      res.status(403);
      throw new Error(
        `Access Denied: Your role (${userRoles.join(', ')}) is not authorized to access this resource.`
      );
    }

    next();
  };
};

export default authorizeRoles;