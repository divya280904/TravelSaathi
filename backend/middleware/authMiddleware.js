import jwt from 'jsonwebtoken';

/**
 * Express middleware to protect API routes with JWT verification
 */
export const protect = async (req, res, next) => {
    let token;

    if (req.query?.token) {
        token = req.query.token;
    } else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'travelsaathi-pro-secret-key');
            req.user = decoded;
            return next();
        } catch (error) {
            console.error('JWT Token Verification Error:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    return res.status(401).json({ message: 'Not authorized, no token provided' });
};
