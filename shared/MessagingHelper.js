const _ = require("lodash");
const logger = require("./CampFactsLogger");

module.exports.twilio = require("./TwilioMessagingHelper.js");
module.exports.bandwidth = require("./BandwidthMessagingHelper.js");
module.exports.default = module.exports.twilio;

module.exports.ParseMessage = function(req, requireSignature = false)
{
    var message = module.exports.default.ParseMessage(req, requireSignature);
    if(!message)
    {
        return Promise.reject("Unable to parse message");
    }

    // Validate the message
    if(!message.id || !message.from || !message.to || (!message.text && !message.media))
    {
        return Promise.reject("Missing required message property. " + JSON.stringify(message));
    }

    logger.info(`Received message`, message);    
    return Promise.resolve(message);
};

module.exports.SendMessage = async function(to, message, mediaUrl, team)
{
    if(!to)
    {
        throw "You must provide at least one number to send the message to.";
    }

    if(!message && !mediaUrl)
    {
        throw "You must provide a message or mediaUrl to send";
    }

    if(!Array.isArray(to))
    {
        to = [to];
    }

    var sendMessagePromises = _.map(
        to, 
        async number => {
            var isReal = !number.startsWith("+1555");

            var debugInfo = "";
            if(message != null) debugInfo += message;
            if(mediaUrl != null)
            {
                if(debugInfo != "")
                {
                    debugInfo += " | ";
                }
                debugInfo += "URL:" + mediaUrl;
            }

            logger.info(`Sending message.`, {service: isReal ? module.exports.default.Name : "Fake", to: number, message: debugInfo.replace("\n", "\\n"), team: team});
            if(isReal)
            {
                await module.exports.default.SendMessage(number, message, mediaUrl);
            }
        });

    await Promise.all(sendMessagePromises);
};