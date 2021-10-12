const authRouter = require("./src/router");

exports.handler = async (event) => {
    try {
        return await authRouter.handler(event);
    } catch (error) {
        console.log(error);
        return error
    }
};
