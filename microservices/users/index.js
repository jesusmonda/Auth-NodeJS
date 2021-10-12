const userRouter = require("./src/router");

exports.handler = async (event) => {
    try {
        return await userRouter.handler(event);
    } catch (error) {
        console.log(error);
        return error
    }
};
