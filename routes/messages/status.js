var logger = require("../../shared/CampFactsLogger");

module.exports =
{
    path: "/message/status",
    method: "POST",
    
    respond: async function (req, res) {

        if(req.body.MessageStatus == 'failed')
        {
            logger.warn("Message send failure.", req.body);
        }

        res.status(204).end();
    }
};