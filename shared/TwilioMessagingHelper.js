// Setup Twilio Stuff
var Message = require('./Message');
var twilio = require('twilio');
var client = module.exports.client = twilio(process.env.TWILIO_ACCOUNT, process.env.TWILIO_TOKEN);

module.exports.Name = "Twilio";
module.exports.Number = process.env.TWILIO_NUMBER;

module.exports.ParseMessage = function(req, requireSignature = false)
{
    var params = req.body;

    if(requireSignature)
    {
        var signatureHeader = req.headers["x-twilio-signature"];
        if(!signatureHeader)
        {
            throw "Missing signature header.";
        }

        if(!twilio.validateRequest(process.env.TWILIO_TOKEN, signatureHeader, req.originalUrl, params))
        {
            throw "Invalid signature header.";
        }
    }

    var media = [];
    if(params.NumMedia > 0)
    {
        for(var i = 0; i < params.NumMedia; i++)
        {
            media.push(params["MediaUrl" + i]);
        }
    }

    return new Message(params.MessageSid, params.To, params.From, params.Body, media);
};

module.exports.SendMessage = async function(to, message, mediaUrl)
{
    var messageRequest = {
        to: to,
        //from: module.exports.Number,
        messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE
    };

    if(message) { messageRequest.body = message; };
    if(mediaUrl) { messageRequest.mediaUrl = mediaUrl; };

    var messageStatus = await client.messages.create(messageRequest);
    return messageStatus.sid;
};