const authController = require("./controller");
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

exports.handler = async (event) => {
    try {
        let response;
        const body = JSON.parse(event.body) || {}
        const pathParameters = event.pathParameters || {}
        const queryStrings = event.queryStrings || {}

        switch (event.resource) {
            case "/login":
                response = await authController.login(dynamodb, body.email, body.password, event.requestContext.identity.userAgent);
                break;
            case "/register":
                response = await authController.register(dynamodb, body.email, body.password, event.requestContext.identity.userAgent);
                break;
            case "/logout":
                console.log(event)
                 response = await authController.logout(dynamodb, event.headers.Authorization.replace('Bearer ', ''));
                break;
            case "/refresh_token":
                response = await authController.refresh_token(dynamodb, body.access_token, body.refresh_token, event.requestContext.identity.userAgent);
                break;
            default:
                return {statusCode: 400, body: "Not found route"}
        }
        return {statusCode: 200, body: JSON.stringify(response)}

    } catch (error) {
        throw {
            statusCode: error.statusCode || 500,
            body: JSON.stringify(error.body) || error
        };
    }
};
