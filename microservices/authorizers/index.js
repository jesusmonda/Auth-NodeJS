const authController = require("./src/controller");
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

exports.handler = async (event, context, callback) => {
    try {
        const response = await authController.verifyToken(dynamodb, event.authorizationToken.replace('Bearer ', ''));

        switch (response.status) {
            case 'Allow':
                callback(null, generatePolicy(response.body, 'Allow', event.methodArn)); // 200
                break;
            case 'Deny':
                callback(null, generatePolicy({}, 'Deny', event.methodArn)); // 403
                break;
            default:
                callback("Unauthorized"); // 401
        }
    } catch (error) {
        console.log(error);
        callback("Unauthorized"); // 401
    }
};

var generatePolicy = function (principalId, effect, resource) {
    var authResponse = {};
    authResponse.principalId = principalId;
    if (effect && resource) {
        var policyDocument = {};
        policyDocument.Version = '2012-10-17';
        policyDocument.Statement = [];
        var statementOne = {};
        statementOne.Action = 'execute-api:Invoke';
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }
    // Optional output with custom properties of the String, Number or Boolean type.
    authResponse.context = principalId;
    return authResponse;
};
