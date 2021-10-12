const jwt = require('jsonwebtoken');
const authService = require("./service");

exports.verifyToken = async (dynamodb, access_token) => {
    try {
        if (!access_token) {
            return { status: "Unauthorized"}; // No token
        }

        const decoded = jwt.verify(access_token, process.env.JWT_SECRET, {ignoreExpiration: false});

        const user_token = await authService.getAccessToken(dynamodb, access_token);
        if (decoded.userId !== user_token.Item.userId) {
            return {status: "Unauthorized"} // Not match database and token userId
        }

        return {
            status: "Allow", 
            body: decoded
        }
    }
    catch (error) {
        console.log(error)
        return {status: "Deny"} // Expired token
    }
};
