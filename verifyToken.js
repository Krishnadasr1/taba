const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization; // Assuming the token is passed in the Authorization header

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized - Missing token' });
  }

  jwt.verify(token, 'your-secret-key', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }

    // Attach user information to the request for further processing
    req.userId = decoded.userId;

    next(); // Move on to the next middleware or route handler
  });
};

module.exports = verifyToken;
