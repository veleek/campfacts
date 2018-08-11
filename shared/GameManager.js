const _ = require("lodash");

const MessagingHelper = require("./MessagingHelper.js");
const TeamManager = require("./TeamManager.js");
const TeamStates = TeamManager.TeamStates;
const processImage = require("./ProcessImage.js");
const logger = require("./CampFactsLogger");

const campName = "Camp Northwind";
const cabinName = `${campName} cabin`;
const campersName = "Northwinders";
//const campName = "FabriCamp";
//const cabinName = "FabriCabin";
//const campersName = "FabriCampers";

const promoImages = [
    [
        "https://imgur.com/CAMqXJl.jpg",
        "https://imgur.com/9X6VT4H.jpg",
        "https://imgur.com/1WR6xMb.jpg",
        "https://imgur.com/oZbZVyY.jpg",
        "https://imgur.com/l1sg2JO.jpg",
        "https://imgur.com/FWtxqRo.jpg",
        "https://imgur.com/ID9z7s3.jpg",
        "https://imgur.com/NnNoSmW.jpg"

    ],
    [
        "https://imgur.com/Gq4vyD4.jpg",
        "https://imgur.com/DCOz0xU.jpg",
        "https://imgur.com/vNYYEQn.jpg",
        "https://imgur.com/rRihwZk.jpg",
        "https://imgur.com/PvOOxNT.jpg",
        "https://imgur.com/1MTJUto.jpg",
        "https://imgur.com/Oz9Htz5.jpg",
        "https://imgur.com/vxpj3oH.jpg"
    ]
];

const minGoldMembers = 4;

const goldPhrase = "CATMEMESPLZCATMEMESPLZ";
const facts = [
    `Did you know that ${campName} was founded in 1818!`,
    `There are an average of 1500 ${campersName} at ${campName} every summer!`,
    `${campName} prides itself on having a flawless safety record!`,
    `There are many different activites offered at ${campName}!`,
    `Almost a ton of pizza and hotdogs is consumed each week by ${campersName}!`,
    `${cabinName}s are constructed from sustainably sourced maple wood!`,
    `Every ${cabinName} has its own canoe!`,
    `The most popular activity at ${campName} is archery!`,
    `Every ${campName} canoe has a unique color!`,
    `Every year ${campName} holds an amazing year-end jamboree!`,
    `Each of the ${cabinName}s is named after a pioneering natural scientist!`,
    `Almost a third of ${campersName} come back as counselors!`,
    `More than two thirds of ${campersName} come to ${campName} two years in a row!`,
    `All the firewood burned in ${campName} is offset by trees planted by ${campersName}!`,
    `The chocolate eaten in s'mores at ${campName} each summer could cover a soccer field!`
];

const maxLetterIndex = 33;
const factsLookup = _.map(facts, f => f.replace(/[^A-Za-z0-9]+/g, "").toUpperCase().substr(0,maxLetterIndex));

const finalAnswer = "STAHP PLZ";

function GameManager(teamManager)
{
    this.teamManager = teamManager;
}

module.exports = GameManager;
module.exports.facts = facts;
module.exports.factsLookup = factsLookup;

module.exports.Create = async function(teamManagerPromise)
{
    if(!teamManagerPromise)
    {
        teamManagerPromise = TeamManager.Create();
    }

    return new GameManager(await teamManagerPromise);
};

GameManager.prototype.processTeam = async function(team)
{
    if(team.members.length == 0)
    {
        // Ignore teams with no members.
    }

    switch(team.state)
    {
        case TeamStates.Basic:
        {
            var nextImage = this.getNextImageForTeam(team);
            await this.teamManager.updateTeam(team);
            await this.SendMessage(team, team.members, null, nextImage);
            break;
        }
        case TeamStates.Referral:
        {
            team.nextUpdate = getNextUpdate(60);
            await this.teamManager.updateTeam(team);
            await this.sendNewReferralMessage(team, team.members, false);
            break;
        }
        case TeamStates.Premium:
        {
            if(team.members.length < minGoldMembers)
            {
                await this.SendMessage(team, team.members, 
                    `You've only got ${team.members.length}/${minGoldMembers} active users required for CampFacts! Gold™. `+
                    `Inactive members text RESUME or invite cabin mates to join with code ${team.referralCode}.`);
                team.nextUpdate = getNextUpdate(60 * 30);
                await this.teamManager.updateTeam(team);
                return;
            }

            if(team.membersToMessage == undefined || team.membersToMessage.length == 0)
            {
                team.membersToMessage = _.shuffle(team.members);
            }
        
            var nextMemberToMessage = team.membersToMessage.shift();
            var nextMessage = this.getNextMessageForTeam(team);
        
            await this.teamManager.updateTeam(team);

            if(!nextMessage)
            {
                // We're at a reset point.
                await this.SendMessage(team, team.members, "Text PAUSE to temporarily stop CampFacts!  Have you been sharing your facts with all your friends?!");
            }
            else
            {
                await this.SendMessage(team, nextMemberToMessage, nextMessage);
            }
            break;
        }
    }
};

GameManager.prototype.getNextImageForTeam = function(team)
{
    if(team.imagesToSend === undefined)
    {
        throw `Value of imagesToSend is undefined for team ${team.name}`;
    }

    if(team.imagesToSend.length == 0)
    {
        // Pick a random set of images, one for each letter, and shuffle it up
        // to send to the team.
        team.imagesToSend = _.shuffle(_.zipWith(
            promoImages[0], 
            promoImages[1], 
            function(x,y) { return _.sample([x,y]); }
        ));
    }

    var nextImageToSend = team.imagesToSend.shift();

    team.nextUpdate = getNextUpdate(30);

    return nextImageToSend;
};

GameManager.prototype.getNextMessageForTeam = function(team)
{
    if(team.phraseIndex === undefined)
    {
        throw `Invalid team phraseIndex '${team.phraseIndex}' for team ${team.name}`;
    }

    // Send one message every 5 seconds
    team.nextUpdate = getNextUpdate(5);
    team.phraseIndex++;
    
    if(team.phraseIndex >= goldPhrase.length)
    {
        team.phraseIndex = -1;
        return null;
    }

    return this.getMessageForLetter(goldPhrase[team.phraseIndex]);
};

GameManager.prototype.getMessageForLetter = function(letter)
{
    if(letter.length != 1)
    {
        throw "You must provide a single letter";
    }

    letter = letter.toUpperCase();

    // Get a random fact that contains the letter we want.
    var factIndex;
    var fact;

    do
    {
        factIndex = _.random(facts.length - 1);
        fact = factsLookup[factIndex];
    }
    while(fact.indexOf(letter) == -1);

    // Pick a random instance of that letter
    var letterIndices = [];
    for(var i = 0; i < fact.length; i++)
    {
        if (fact[i] === letter) letterIndices.push(i);
    }

    if((letterIndices.length > 2 && _.last(letterIndices) > 26) ||
       (letterIndices.length > 3 && _.last(letterIndices) > 20))
    {
        letterIndices = letterIndices.slice(0, letterIndices.length-1);
    }

    var letterIndex = _.sample(letterIndices);

    // Construct the final fact.  Letter index needs to be incremented by 1 so we don't have fact #0
    var outputFact = `${campName} Fact #${letterIndex+1}: ${facts[factIndex]}\n${getMessageTimestamp()}`;
    return outputFact;
};

GameManager.prototype.processMessage = async function(message)
{
    var team = await this.teamManager.lookupTeam(message.from);
    logger.info("Process message starting.", { team: team ? team.Name : null, message: message });

    if(await this.processSignup(team, message) || await this.processReferralCode(team, message))
    {
        return;
    }

    // If it's not a signup or referral, and the user is not on a team
    // then just ignore the message.
    if(!team)
    {
        return;
    }

    try
    {
        await retry(async () => 
        {
            switch(team.state)
            {
                case TeamStates.Basic:
                    await this.processBasic(team, message);
                    break;
                case TeamStates.Referral:
                    await this.processReferral(team, message);
                    break;
                case TeamStates.Premium:
                    await this.processPremium(team, message);
                    break;
                case TeamStates.Done:
                    await this.processDone(team, message);
                    break;
                default:
                    // Ignore all other text messages for now.
                    break;
            }

            logger.debug("Process message complete.", { team: team.name, message: message });
        });
    }
    catch(error)
    {
        logger.error("Process message error", { team: team.name, message : message, error: error });
    }
};

GameManager.prototype.processSignup = async function(team, message)
{
    if(message.normalizedText != "CAMPFACTS")
    {
        return false;
    }

    // Process the signup request.  
    // If they are not already part of a team, create one for them.
    if(!team)
    {
        team = await this.teamManager.createTeam();
        team = await this.teamManager.addTeamMember(team, message.from);

        // Skip right to ready
        team.state = TeamStates.Ready;
    }

    // If they are already part of a team, and they are in the Ready state, then move them to Basic.
    if(team.state == TeamStates.Ready)
    {
        var update = {
            state: TeamStates.Basic,
            imagesToSend: [],
        };

        team = await this.teamManager.updateTeam(team, update);

        // Send every member a message
        var introMessage = `Thank you for subscribing to CampFacts!  We hope you're excited to learn about ${campName}.`;
        await this.SendMessage(team, team.members, introMessage);
    }
    else
    {
        // Ignore it as a sign-up now and allow someone to handle it later.
        return false;
    }

    return true;
};

GameManager.prototype.processReferralCode = async function(team, message)
{
    // See if the message is a referral code.
    var referralTeam = await this.teamManager.getReferralTeam(message.normalizedText);
    if(!referralTeam)
    {
        // This is not a referral code.
        return false;
    }

    if(referralTeam.state != TeamStates.Referral && referralTeam.state != TeamStates.Premium)
    {
        logger.debug("Ignoring referral for team not in Referral or Premium states.");
        return true;
    }

    // If the user is already on a team
    if(team)
    {
        // Check if it's the team the referral is for
        if(team._id.equals(referralTeam._id))
        {
            // Just resend the signup message.
            await this.sendNewReferralMessage(referralTeam, message.from);
            return true;
        }

        if(team.members.length > 1)
        {
            // Otherwise let them know how to leave.
            await this.SendMessage(referralTeam, message.from, "You're already part of another team!  Text UNSUBSCRIBE to leave that team and then try joining again.");    
            return true;
        }

        // If they're the only person on the team and they're in referral mode, let them know they're code won't work.
        if(team.state == TeamStates.Referral || team.state == TeamStates.Premium)
        {
            await this.SendMessage(referralTeam, message.from, "You're leaving your current team to join another team.  Your referral code will no longer work.");
        }

        // Then remove them from the team.
        await this.teamManager.removeTeamMember(team, message.from);
    }

    // Add the new team member to the team.
    referralTeam = await this.teamManager.addTeamMember(referralTeam, message.from);
    referralTeam = await this.teamManager.updateTeam(referralTeam, { nextUpdate: getNextUpdate(60)});

    // Send a message to the joiner, and the other team members separately
    var messagePromises = _.map(referralTeam.members, m => this.sendNewReferralMessage(referralTeam, m, m == message.from));
    await Promise.all(messagePromises);

    return true;
};

GameManager.prototype.processBasic = async function(team, message)
{
    switch (message.normalizedText)
    {
        case "STOP":
        case "UNSUBSCRIBE":
            await this.teamManager.removeTeamMember(team, message.from);
            await this.SendMessage(team, message.from, "You have been unsubscribe from CampFacts!  Text CAMPFACTS to get back on the fact train!");
            break;
        case "GOLD":
            team.state = TeamStates.Referral;
            team.nextUpdate = getNextUpdate(1);
        
            await this.teamManager.updateTeam(team);
            await this.sendNewReferralMessage(team, message.from, true);
            break;
        default:
            return;
    };
};

GameManager.prototype.processReferral = async function(team, message)
{
    switch (message.normalizedText)
    {
        case "STOP":
        case "UNSUBSCRIBE":
            await this.teamManager.removeTeamMember(team, message.from);
            await this.SendMessage(team, message.from, "You have been unsubscribe from CampFacts!  Text CAMPFACTS to get back on the fact train!");
            await this.sendNewReferralMessage(team, team.members, false);
            return;
        case "GO":
            if(team.members.length >= minGoldMembers)
            {
                await this.activatePremium(team);
            }
            else
            {
                await this.sendNewReferralMessage(team, message.from);
            }
    }
};

GameManager.prototype.processPremium = async function(team, message)
{
    if(message.media.length > 0)
    {
        // If they sent an image immediately respond
        await this.SendMessage(team, message.from, `Thanks for your ${campName} Meme Contest submission! We'll be revealing the winners soon!`);

        // Then process the images in the background.
        var processImages = _.map(message.media, media => processImage(media));
        var results = await Promise.all(processImages);

        if(_.some(results))
        {
            // At least one of the images was a cat meme.

            var team = await this.teamManager.lookupTeam(message.from);
            await this.teamManager.updateTeam(team, { state: TeamStates.Done });
                
            var winMessage = `Your meme was selected as one of our winners!  Submit code "${finalAnswer}" to recieve your prize!`;
            await this.SendMessage(team, team.members, winMessage);
        }
        else
        {
            var loseMessage = "Thanks for trying, but your submission wasn't selected.";
            await this.SendMessage(team, message.from, loseMessage);
        }
    }
    else
    {
        switch(message.normalizedText)
        {
            case "STOP":
            case "UNSUBSCRIBE":
            case "PAUSE":
                if(await this.teamManager.pauseTeamMember(team, message.from))
                {
                    await this.SendMessage(team, message.from, 
                        `You have paused CampFacts!  Text RESUME to continue receiving the best facts about ${campName}.`);
                }
                break;
            case "RESUME":
            case "CAMPFACTS":
                if(await this.teamManager.resumeTeamMember(team, message.from))
                {
                    await this.SendMessage(team, message.from, 
                        `You have resumed CampFacts!  Get ready to receive all the best facts about ${campName}.`);
                }
                break;
            case "CATMEMESPLZ":
                await this.SendMessage(team, message.from, null, 'https://i.imgur.com/MMZi1Of.gif');
                // https://i.imgur.com/OZidOOn.gifv
                // https://i.imgur.com/nQYSLUd.jpg
                break;
        }
    }
};

GameManager.prototype.processDone = async function(team, message)
{
    // They're already done, but we'll allow them to keep sending images.
    // Just process the first one for simplicity
    var result = await processImage(message.media[0], true);

    if(result.isCatMeme)
    {
        await this.SendMessage(team, message.from, `Cat memes are PURRfect! You submitted "${finalAnswer}" already right?`);
    }
    else
    {
        if(result.isCat)
        {
            await this.SendMessage(team, message.from, `Well, that looks like a cat, but I don't think it's a meme.`);
        }
        else if(result.isMeme)
        {
            await this.SendMessage(team, message.from, `Hmm... it seems to be a meme, but it's in the wrong CATegory :3`);
        }
        else
        {
            await this.SendMessage(team, message.from, `Uhhh... what is this even supposed to be?`);
        }
    }
};

GameManager.prototype.sendNewReferralMessage = async function(team, member, newMember = false)
{
    var message = "";

    if(newMember)
    {
        message = "Thanks! ";
    }

    if(team.members.length >= minGoldMembers)
    {
        message += `You're ready for CampFacts! Gold™.  Send GO to activate or use code ${team.referralCode} to sign up more people first.`;
    }
    else
    {
        message += `You have ${team.members.length}/${minGoldMembers} people needed for CampFacts! Gold™.  Get cabin mates to join by texting code ${team.referralCode} to ${MessagingHelper.default.Number}!`;
    }

    await this.SendMessage(team, member, message);
};

GameManager.prototype.activatePremium = async function(team)
{
    var premiumUpdates = {
        state: TeamStates.Premium,
        nextUpdate: getNextUpdate(5)
    };

    await this.teamManager.updateTeam(team, premiumUpdates);

    const welcomeMessage = `Thanks for activating CampFacts! Gold™. Get ready to receive the all the best facts about ${campName}! Make sure to share them with your friends!`;
    await this.SendMessage(team, team.members, welcomeMessage);
};

GameManager.prototype.SendMessage = async function(team, to, message, mediaUrl)
{
    await MessagingHelper.SendMessage(to, message, mediaUrl, team.name);
};

function getNextUpdate(updateDelaySeconds)
{
    var now = new Date();
    var nextUpdate = new Date(now);
    nextUpdate.setSeconds(now.getSeconds() + updateDelaySeconds);

    return nextUpdate;
}

function getMessageTimestamp()
{
    var date = new Date();
    date.setHours(date.getHours() - 7);
    var dateString = date.toLocaleString("en-US", { hour:"numeric", minute: "numeric", second: "numeric", hour12: true });
    return `Sent: ${dateString}`;
}

async function retry(action, maxRetries = 3)
{
    while(true)
    {
        try
        {
            return await action();
        }
        catch(error)
        {
            logger.warn("Retry failed. " + error, { error: error });
            if(maxRetries == 0)
            {
                throw error;
            }

            maxRetries--;
            await delay(100);
        }
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}