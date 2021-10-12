const AWS = require("aws-sdk");

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
            }, 
            ProjectionExpression: "#userId", 
        }).promise();

        // Format response
        response.Item = AWS.DynamoDB.Converter.unmarshall(response.Item);
    
        return response
    }
    catch (error) {
        throw error;
    }
};
