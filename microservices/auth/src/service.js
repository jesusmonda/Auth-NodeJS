const AWS = require("aws-sdk");
const { v4: uuidv4 } = require('uuid');

exports.get_user = async (dynamodb, email) => {
    try {
        const response = await dynamodb.scan({
            ExpressionAttributeValues: {
            ":email": {
                    S: email
                }
            }, 
            FilterExpression: "email = :email",
            ExpressionAttributeNames: {
                "#userId": "id",
                "#password": "password",
            }, 
            ProjectionExpression: "#userId,#password", 
            TableName: "users",
        }).promise();

        // Format response
        response.Items = response.Items.map(x => {
            return AWS.DynamoDB.Converter.unmarshall(x)
        })
        response.Items = response.Items[0]

        return response
    }
    catch (error) {
        throw error;
    }
};

exports.save_token = async (dynamodb, userId, access_token, refresh_token, userAgent) => {
    try {
        await dynamodb.putItem({
            Item: {
                "userId": {
                    S: userId
                }, 
                "accessToken": {
                    S: access_token
                }, 
                "refreshToken": {
                    S: refresh_token
                },
                "userAgent": {
                    S: userAgent
                }
            }, 
            ReturnConsumedCapacity: "TOTAL", 
            TableName: "users_tokens"
        }).promise();
    }
    catch (error) {
        throw error;
    }
};

exports.remove_token = async (dynamodb, access_token) => {
    try {
        await dynamodb.deleteItem({
            Key: {
                "accessToken": {
                    S: access_token
                }
            }, 
            TableName: "users_tokens"
        }).promise();
    }
    catch (error) {
        throw error;
    }
};

exports.save_user = async (dynamodb, userId, email, password, role) => {
    try {
        await dynamodb.putItem({
            Item: {
                "id": {
                    S: userId
                }, 
                "email": {
                    S: email
                }, 
                "password": {
                    S: password
                },
                "role": {
                    S: role
                }
            }, 
            ReturnConsumedCapacity: "TOTAL", 
            TableName: "users"
        }).promise();
    }
    catch (error) {
        throw error;
    }
};

exports.getAccessToken = async (dynamodb, access_token) => {
    try {
        let response = await dynamodb.getItem({
            Key: {
             "accessToken": {
               S: access_token
              },
            }, 
            TableName: "users_tokens",
            ExpressionAttributeNames: {
                "#userId": "userId",
                "#role": "role",
                "#refreshToken": "refreshToken",
            }, 
            ProjectionExpression: "#userId, #refreshToken, #role", 
        }).promise();

        // Format response
        response.Item = AWS.DynamoDB.Converter.unmarshall(response.Item);
    
        return response
    }
    catch (error) {
        throw error;
    }
};

exports.update_access_token = async (dynamodb, access_token, new_access_token) => {
    try {
        const user_token = await dynamodb.getItem({
            Key: {
                "accessToken": {
                    S: access_token
                }
            }, 
            TableName: "users_tokens"
        }).promise();

        // Format response
        user_token.Item = AWS.DynamoDB.Converter.unmarshall(user_token.Item);

        await dynamodb.deleteItem({
            Key: {
                "accessToken": {
                    S: access_token
                }
            }, 
            TableName: "users_tokens"
        }).promise();

        await dynamodb.putItem({
            Item: {
                "accessToken": {
                    S: new_access_token
                }, 
                "refreshToken": {
                    S: user_token.Item.refreshToken
                }, 
                "userId": {
                    S: user_token.Item.userId
                },
                "userAgent": {
                    S: user_token.Item.userAgent
                }
            },
            ReturnConsumedCapacity: "TOTAL", 
            TableName: "users_tokens"
        }).promise();
    }
    catch (error) {
        throw error;
    }
};