const _ = require("lodash");
const logger = require("../shared/CampFactsLogger");

const connectionString = "UseDevelopmentStorage=true";
const queueName = 'team-messages';

var Message = require("../shared/Message");
var GameManager = require("../shared/GameManager.js");
var gameManager = null;
var azure = require('azure-storage');
var queueService = azure.createQueueService(connectionString);

queueService.createQueueIfNotExists(queueName, async function(error) 
{
    if (error) 
    {
        logger.error(`Unable to create queue`, { queueName: queueName, error: error });
        process.exit(1);
    }
    
    gameManager = await GameManager.Create();
    processMessages();
});

function getMessages()
{
    return new Promise((resolve, reject) => {
        queueService.getMessages(queueName, function(error, serverMessages) {
            if(error)
            {
                reject(error);
            }
            else
            {
                resolve(serverMessages);
            }
        });
    });
}

async function processMessages()
{
    try
    {
        var serverMessages = await getMessages();

        if(serverMessages.length == 0)
        {
            await delay(1000);
            return;
        }

        // Process all of the messages in parallel.
        var processTasks = _.map(serverMessages, async queueMessage => 
        {
            try
            {  
                var messageBuffer = Buffer.from(queueMessage.messageText, 'base64'); 
                var messageData = JSON.parse(messageBuffer.toString());
                var message = Object.assign(new Message(), messageData);

                try
                {
                    await gameManager.processMessage(message);
                }
                catch(error)
                {
                    logger.error("Failed while processing message.", error);
                }

                deleteMessage(queueMessage);
            }
            catch(error)
            {
                logger.error(error);
                logger.error("Failed to process message", { queueMessageId: queueMessage.messageId, error: error });
                // What do we do here?  Ignore it and let it get picked up later?  Re-queue it?

                if(queueMessage.dequeueCount > 5)
                {
                    deleteMessage(queueMessage);
                }
            }
        });

        await Promise.all(processTasks);
    }
    catch(error)
    {
        logger.warn(`Unable to get messages from queue.`, { error: error });        
        // Wait a bit just to prevent thrashing on the queue.
        await delay(5000);
    }
    finally
    {
        // Check for more messages after a short delay.
        setTimeout(processMessages, 100);
    }
}

function deleteMessage(message)
{
    queueService.deleteMessage(queueName, message.messageId, message.popReceipt, function(error) 
    {
        if (error) 
        {
            logger.error(`Unable to delete message.`, { messageId: message.messageId, error: error });
            return;
        }
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

logger.verbose("Process Messages worker is running...");