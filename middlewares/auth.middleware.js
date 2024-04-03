const httpErrors = require('http-errors');
const JWT = require('jsonwebtoken');
const notAuthorized = "Request not Authorized";
const { logger } = require("../utils/error_logger/winston");

const authenticateUser = async (req, res, next) => {
    try {
        const accessToken = req.cookies[process.env.JWT_ACCESS_TOKEN_HEADER];

        if (!accessToken) {
            throw httpErrors[401]('Unauthorized');
        }

        const payloadData = JWT.verify(accessToken, process.env.JWT_ACCESS_TOKEN_SECRET_KEY);

        if (!payloadData) {
            throw httpErrors[401](notAuthorized);
        }

        req.payloadData = payloadData;

        next();

    } catch (error) {
        logger.error(error.message, { status: "500", path: __filename });
        console.log(error);
        next(error);
    }
}

module.exports = {
    authenticateUser,
}