const bcrypt = require("bcrypt");
const authService = require("./service");
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

exports.login = async (dynamodb, email, password, userAgent) => {
    try {
        if (!email || !password) {
            throw {statusCode: 400, body: "Invalid email or password"}
        }

        // Get user data
        const user = await authService.get_user(dynamodb, email);
        if (user.Count == 0) {
            throw {statusCode: 403, body: "Not found user"}
        }

        // Verify password
        const compare = await bcrypt.compare(password, user.Items.password);
        if (compare == false) {
            throw {statusCode: 403, body: "Invalid password"}
        }

        const access_token = jwt.sign({uid: uuidv4(), userId: user.Items.id, role: user.Items.role}, process.env.JWT_SECRET, {expiresIn: '30m'});
        const refresh_token = jwt.sign({uid: uuidv4(), userId: user.Items.id, role: user.Items.role}, process.env.JWT_SECRET, {expiresIn: '1d'});
        await authService.save_token(dynamodb, user.Items.id, access_token, refresh_token, userAgent);

        return {
            access_token,
            refresh_token
        }
    } catch (error) {
        throw error;
    }
}

exports.register = async (dynamodb, email, password, userAgent) => {
    try {
        if (!email || !password) {
            throw {statusCode: 400, body: "Invalid email or password"}
        }

        // Get user data
        const response = await authService.get_user(dynamodb, email);
        if (response.Count > 0) {
            throw {statusCode: 403, body: "Not available email"}
        }
        const userId = uuidv4();

        // Hash password
        const hash_password = await bcrypt.hash(password, 10);
        await authService.save_user(dynamodb, userId, email, hash_password, "user");

        const access_token = jwt.sign({uid: uuidv4(), userId: userId, role: "user"}, process.env.JWT_SECRET, {expiresIn: '30m'});
        const refresh_token = jwt.sign({uid: uuidv4(), userId: userId, role: "user"}, process.env.JWT_SECRET, {expiresIn: '1d'});
        await authService.save_token(dynamodb, userId, access_token, refresh_token, userAgent);

        return {
            access_token,
            refresh_token
        }
    } catch (error) {
        throw error;
    }
}

exports.logout = async (dynamodb, access_token) => {
    try {
        await authService.remove_token(dynamodb, access_token);

        return "success"
    } catch (error) {
        throw error;
    }
}

exports.refresh_token = async (dynamodb, access_token, refresh_token, userAgent) => {
    try {
        if (!access_token || !refresh_token) {
            throw {statusCode: 400, body: "No token"}
        }

        const decoded_access = jwt.decode(access_token);
        const decoded_refresh = jwt.decode(refresh_token);

        // Check both user on token
        if (decoded_access.userId != decoded_refresh.userId) {
            throw {statusCode: 403, body: "No valid tokens"}
        }

        // Valid refresh token on db
        const user_token = await authService.getAccessToken(dynamodb, access_token);
        if (user_token.Count == 0) {
            throw {statusCode: 403, body: "No valid tokens"} 
        }
        if (refresh_token !== user_token.Item.refreshToken) {
            throw {statusCode: 403, body: "No valid refresh token"}
        }
        
        const userId = user_token.Item.userId
        let new_access_token = access_token;
        let new_refresh_token = refresh_token;

        // Check expired
        const actual_timestamp = Math.floor(+new Date() / 1000)
        if (decoded_refresh.exp > actual_timestamp) { // No expired refresh token
            console.log("no expired refresh token")
            if (decoded_access.exp <= actual_timestamp) { // Expired access token
                console.log("expired access token")

                // Remove token and login, no update refresh token
                new_access_token = jwt.sign({uid: uuidv4(), userId: userId, role: user_token.Item.role}, process.env.JWT_SECRET, {expiresIn: '30m'});
                await authService.update_access_token(dynamodb, access_token, new_access_token);
    
            } else {
                console.log("no expired access token") // No expired access token
            }
        } else {
            console.log("expired refresh token") // Expired refresh token

            // Logout
            await authService.remove_token(dynamodb, access_token);

            // Login
            new_access_token = jwt.sign({uid: uuidv4(), userId: userId, role: user_token.Item.role}, process.env.JWT_SECRET, {expiresIn: '30m'});
            new_refresh_token = jwt.sign({uid: uuidv4(), userId: userId, role: user_token.Item.role}, process.env.JWT_SECRET, {expiresIn: '1d'});
            await authService.save_token(dynamodb, userId, new_access_token, new_refresh_token, userAgent);

        }

        return {
            access_token: new_access_token,
            refresh_token: new_refresh_token
        }
    }
    catch (error) {
        throw error
    }
}
