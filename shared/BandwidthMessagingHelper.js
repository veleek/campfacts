// Setup Bandwidth Stuff
var bandwidthUsername = process.env.BANDWIDTH_USERNAME;
var bandwidthPassword = process.env.BANDWIDTH_PASSWORD;

var Bandwidth = require("node-bandwidth");

var client = module.exports.client = new Bandwidth({
    userId    : process.env.BANDWIDTH_USERNAME,
    apiToken  : process.env.BANDWIDTH_TOKEN,
    apiSecret : process.env.BANDWIDTH_SECRET
});

module.exports.Name = "Bandwidth";
module.exports.Number = process.env.BANDWIDTH_NUMBER;

module.exports.ParseMessage = function(req, requireSignature = false)
{
    if(requireSignature)
    {
        var authHeader = req.headers["authorization"];
        if(!authHeader)
        {
            throw "Missing authorization header.";
        }

        if(!authHeader.startsWith("Basic "))
        {
            throw "Invalid authorization header.";
        }

        var authBody = new Buffer(authHeader.split(" ")[1], "base64");
        if(authBody != bandwidthUsername + ";" + bandwidthPassword)
        {
            throw "Invalid username or password.";
        }
    }

    // Only grab the non-SMIL items
    var media = [];
    if(req.body.media)
    {
        req.body.media.forEach(m => {
            if(!m.endsWith(".smil"))
            {
                media.push(m);
            }
        });
    }

    return {
        id: req.body.messageId,
        to: req.body.to,
        from: req.body.from,
        text: req.body.text,
        media: media
    };
};

module.exports.SendMessage = async function(to, message, mediaUrl)
{
    var messageRequest = {
        to: to,
        from: Number,
    };

    if(message) { messageRequest.text = message; }
    if(mediaUrl) { messageRequest.media = [ mediaUrl ]; }

    var messageStatus = await client.Message.send(messageRequest);
    return messageStatus.messageId;
};