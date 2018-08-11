const logger = require("../../shared/CampFactsLogger");

module.exports =
{
    path: "/message/error",
    method: "POST",

    respond: async function (req, res) {

        logger.error("Message error", { errorCode: req.body.ErrorCode, url: req.body.ErrorUrl, messageId: req.body.MessageSid});
        res.status(204).end();
    }
};