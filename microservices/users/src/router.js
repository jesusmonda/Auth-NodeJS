const userController = require("./controller");

exports.handler = async (event) => {
    try {
        let response;
        const body = JSON.parse(event.body) || {}
        const pathParameters = event.pathParameters || {}
        const queryStrings = event.queryStrings || {}

        switch (event.resource) {
            case "/users/{id}":
                response = await userController.getUser();
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
