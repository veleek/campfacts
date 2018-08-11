// Imports the Google Cloud client library
//const vision = require('@google-cloud/vision');

//var imageAnnoator = new vision.ImageAnnotatorClient();
const _ = require("lodash");
const request = require("request-promise-native");
const logger = require("./CampFactsLogger");

const catEntities = [
    "Cat",
    "Kitten"
];

const catishEntities = [
    "Lolcat",
    "Grumpy cat",
    "I Can Has Cheezburger?",
    "Whiskers",
    "Meow",
];

const memeEntities = [
    "Meme",
    "Internet meme",
    "Lolcat"
];

const memeishEntities = [
    "GrumpyCat",

    // Common Meme sources
    "I Can Has Cheezburger?",
    "Known Your Meme",
    "Gfycat",
    "Giphy",
    "Imgur",

    // Other indicators
    "Humor",
    "GIF", 
    "Selfie"
];

module.exports = async function(imageUrl, raw = false)
{
    logger.debug(`Analyzing image ${imageUrl}...`);
    //imageUrl = "https://i.chzbgr.com/full/9013912832/h7892F1D7/";
    //imageUrl = "http://cdn2-www.cattime.com/assets/uploads/gallery/25-funny-cat-memes/funny-forrest-gump-parody-cat-memes.jpg";
    var responses = await webDetection(imageUrl);

    var entities = responses[0].webDetection.webEntities;
    var catScore = 0;
    var memeScore = 0;

    _.forEach(entities, entity => {
        // Double the score for obvious indicators
        if(_.includes(catEntities, entity.description)) catScore += entity.score * 2;
        if(_.includes(memeEntities, entity.description)) memeScore += entity.score * 2;

        if(_.includes(catishEntities, entity.description)) catScore += entity.score;
        if(_.includes(memeishEntities, entity.description)) memeScore += entity.score;
    });

    var isCatMeme = catScore > 0.75 && memeScore > 0.75;

    logger.info(`Meme Analysis [${imageUrl}]: Cat Meme ${isCatMeme?"WAS":"WAS NOT"} detected.`,
        { cat: catScore, meme: memeScore, entities: _.chain(entities).keyBy('description').mapValues('score').value() });
            //entities: _.pick(entities, ['description', 'score']});
    console.log("  Score:");
    console.log("  - Cat? " + catScore);
    console.log("  - Meme? " + memeScore);
    console.log("  Entities:");
    _.forEach(entities, entity => {
        console.log(`  - ${entity.description} (${entity.entityId}): ${entity.score}`);
    });
    
    if(!raw)
    {
        return isCatMeme;
    }
    
    return {
        catScore: catScore,
        memeScore: memeScore,
        isCat: catScore > 0.75,
        isMeme: memeScore > 0.75,
        isCatMeme: isCatMeme,
    };
};

var webDetection = async function(imageUri)
{
    var body = {
        requests: [
            {
                image: { source: { imageUri: imageUri } },
                features: [{ "type": "WEB_DETECTION", "maxResults": 10 }]
            }
        ]
    };

    var apiKey = process.env.GOOGLE_APIKEY;
    var uri = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

    var options = {
        method: "POST",
        uri: uri,
        body: body,
        json: true
    };

    var response = await request(options);
    return response.responses;
};