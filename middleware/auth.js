const jwt = require('jsonwebtoken');

const softAuth = (req, res, next) => {
    const token = req.header('x-auth-token') || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (!token) {
        req.user = null; // No user, but don't block
        return next();
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
    } catch (err) {
        req.user = null; // Invalid token, treat as guest
    }
    next();
};

module.exports = { softAuth }; 