var MessagingHelper = require("../../shared/MessagingHelper.js");
var logger = require("../../shared/CampFactsLogger");

const connectionString = "UseDevelopmentStorage=true";
const queueName = 'team-messages';

var azure = require('azure-storage');
var queueService = azure.createQueueService(connectionString);
queueService.createQueueIfNotExists(queueName, function(error) 
{
    if (error) 
    {
        logger.info(`Unable to create queue '${queueName}'.`, error);
        process.exit(1);
    }
});

module.exports =
{
    path: "/message",
    method: "POST",

    respond: async function (req, res)
    {
        try
        {
            var message = await MessagingHelper.ParseMessage(req);
         
            var messageText = Buffer.from(JSON.stringify(message)).toString('base64');

            // Add the message to the queue
            queueService.createMessage(queueName, messageText, function(error) 
            {
                if(error)
                {
                    logger.error(`Unable to queue incoming message '${message.id}' to queue.`, error);
                }
            });

            res.status(204).end();
        }
        catch(err)
        {
            logger.error("There was an issue processing the message.", err.stack);
            res.status(400).send({ error: err});
        };
    }
};