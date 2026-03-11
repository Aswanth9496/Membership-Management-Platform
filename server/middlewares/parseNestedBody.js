/**
 * Simple middleware to parse dot-notated fields in req.body into nested objects.
 * Useful for multer + express-validator with nested objects.
 */
const parseNestedBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const newBody = {};
    
    Object.keys(req.body).forEach(key => {
      const parts = key.split('.');
      let current = newBody;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          current[part] = req.body[key];
        } else {
          current[part] = current[part] || {};
          current = current[part];
        }
      }
    });

    // Handle boolean and number conversions if needed
    // Simple version:
    req.body = newBody;
  }
  next();
};

module.exports = parseNestedBody;
