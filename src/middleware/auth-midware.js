const JWT = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

// Middleware for JWT verification
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' }); // Token tidak ada atau format tidak valid
    }

    const token = authHeader.split(' ')[1];
    console.log("Token received:", token); // Log token yang diterima

    JWT.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            console.error('Invalid token:', token);
            return res.status(401).json({ message: "Invalid token!" });
        }

        // Add decoded token to the request object for use in the next endpoint
        req.user = decoded;
        next()
    })
}

module.exports = { verifyJWT };