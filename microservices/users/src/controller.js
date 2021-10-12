const userService = require("./service");

exports.getUser = async () => {
    try {
        return {foo: "Example endpoint"};
    } catch (error) {
        throw error;
    }
}