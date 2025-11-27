const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        // Check if authorization header exists
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                message: 'No authorization header provided'
            });
        }

        // Check if it starts with Bearer
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Invalid authorization format. Use Bearer token'
            });
        }

        // Extract token
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                message: 'No token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: 'Invalid token'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Token expired'
            });
        } else {
            return res.status(401).json({
                message: 'Auth failed'
            });
        }
    }
};
