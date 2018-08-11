var _ = require('lodash');
var MessagingHelper = require("../../shared/MessagingHelper.js");
var logger = require("../../shared/CampFactsLogger");

module.exports =
{
    path: "/message/send",
    method: "POST",

    respond: async function (req, res)
    {
        try
        {
            var recipients = _.castArray(_.split(req.body.to, ' '));

            for(var i=0; i<recipients.length; i++)
            {
                var recipient = recipients[i];
                if(recipient)
                {
                    await MessagingHelper.SendMessage(recipient, req.body.text, req.body.mediaUrl, null);
                }
            }

            res.status(204).end();
        }
        catch(err)
        {
            logger.error("Error sending message.", { error: err.stack });
            res.status(400).send({ error: err});
        };
    }
};