// A scalable, multi-entity Role-Based Access Control (RBAC) middleware
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. Identify the authenticated entity dynamically
    // In a multi-portal architecture, different auth middlewares populate different request objects.
    const entity = req.admin || req.user || req.labAssistant;

    if (!entity) {
      res.status(401);
      throw new Error('Not authorized: Authentication context missing.');
    }

    // 2. Determine the entity's roles
    // We normalize the roles into an array to support users with multiple roles in the future.
    let userRoles = [];
    
    if (entity.role) {
      // Admins or users with explicit role fields (e.g., 'SuperAdmin', 'Data_Analyst')
      userRoles = Array.isArray(entity.role) ? entity.role : [entity.role];
    } else if (req.user) {
      // Implicit role for standard users
      userRoles = ['User'];
    } else if (req.labAssistant) {
      // Implicit role for lab assistants
      userRoles = ['LabAssistant'];
    }

    // 3. Check for intersection between allowed roles and user roles
    const hasAccess = userRoles.some(role => allowedRoles.includes(role));

    if (!hasAccess) {
      res.status(403);
      throw new Error(
        `Access Denied: Your role (${userRoles.join(', ')}) is not authorized to access this resource.`
      );
    }

    next();
  };
};