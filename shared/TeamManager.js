const uuid = require('uuid/v4');
const _ = require('lodash');
const logger = require('../shared/CampFactsLogger');

var DbHelper = require("./DbHelper.js");

function TeamManager(dbHelper)
{
    //throw JSON.stringify(dbHelper);
    this.teams = dbHelper.collection('teams');
}

module.exports = TeamManager;

const TeamStates = module.exports.TeamStates = {
    Waiting: "Waiting", // A team exists but has not been enabled yet.
    Ready: "Ready", // Ready to go and can sign-up for Camp Facts!
    Basic: "Basic", // Signed up for CampFacts! basic.
    Referral: "Referral", // Using referral codes to activate premium
    Premium: "Premium", // In premium mode.
    Done: "Done",
};

module.exports.Create = async function(dbHelperPromise)
{
    var helper = await (dbHelperPromise || DbHelper.Create());
    return new TeamManager(helper);
};

TeamManager.prototype.close = function() {
    this.client.close();
};

TeamManager.prototype.lookupTeam = function(phoneNumber)
{
    phoneNumber = this.normalizeNumber(phoneNumber);
    return this.teams.findOne(
    { 
        $or: [ 
            { members: phoneNumber }, 
            { inactiveMembers: phoneNumber } 
        ]
    });
};

TeamManager.prototype.getTeam = function(name)
{
    return this.teams.findOne({name: name});
};

TeamManager.prototype.getReferralTeam = function(referralCode)
{
    return this.teams.findOne({ referralCode: referralCode });
};

TeamManager.prototype.getTeams = function(filter = {}, sort = {name: 1})
{
    return this.teams.find(filter).sort(sort).toArray();
};

TeamManager.prototype.createTeam = async function(name)
{
    var referralCode = this.generateReferralCode();

    var team = {
        name: name || ("AUTO:" + referralCode),
        state: TeamStates.Waiting,
        // The full list of members on this team.
        members: [],
        // Members who have paused messages.
        inactiveMembers: [],
        // The ordered list of members to message next.
        membersToMessage: [],
        // The ordered list of images to send next.
        imagesToSend: [],
        phraseIndex: -1,
        referralCode: referralCode,
        lastUpdated: new Date(),
        nextUpdate: new Date(),
        etag: uuid(),
    };

    var result = await this.teams.updateOne(
        { name: name },
        { $setOnInsert: team},
        { upsert: true }
    );
    
    if(result.matchedCount == 1)
    {
        throw "That team already exists.";
    }
    else if(result.upsertedCount != 1)
    {
        throw "Failed to create team";
    }

    return await this.getTeam(team.name);
};

TeamManager.prototype.updateTeam = async function(team, updates, etag)
{
    if(!team && !team._id)
    {
        throw "No team provided to update";
    }

    etag = etag || team.etag;

    updates = updates || team;
    updates.etag = uuid();
    updates.lastUpdated = new Date();

    var result = await this.teams.updateOne(
        {
            _id: team._id,
            etag: etag
        },
        { $set: updates || team }
    );

    if(result.matchedCount != 1)
    {
        throw "Team was modified by someone else.";
    }

    if(result.modifiedCount != 1)
    {
        throw "Unable to modify team for some reason";
    }

    return await this.getTeam(team.name);
};

TeamManager.prototype.deleteTeam = async function(team)
{
    var result = await this.teams.deleteOne({_id: team._id});
        
    if(result.deletedCount != 1)
    {
        throw "Failed to delete team.  It may already be deleted.";
    }
};

TeamManager.prototype.addTeamMember = async function(team, phoneNumber)
{
    team.members = team.members || [];

    phoneNumber = this.normalizeNumber(phoneNumber);
    if(team.members.indexOf(phoneNumber) == -1)
    {
        logger.debug("Adding team member", { team: team.name, member: phoneNumber });
        team.members.push(phoneNumber);
        return this.updateTeam(team, { members: team.members });
    }

    return Promise.resolve(team);
};

TeamManager.prototype.removeTeamMember = async function(team, phoneNumber)
{
    phoneNumber = this.normalizeNumber(phoneNumber);
    var index = team.members.indexOf(phoneNumber);
    if(index != -1)
    {
        logger.debug("Removing team member", { team: team.name, number: phoneNumber });
        team.members.splice(index, 1);

        if(team.members.length == 0)
        {
            await this.deleteTeam(team);
            return null;
        }
        else
        {
            return await this.updateTeam(team, { members: team.members });
        }
    }

    logger.debug("Team member not found on team.", { team: team.name, number: phoneNumber });
    return team;
};

TeamManager.prototype.pauseTeamMember = async function(team, phoneNumber)
{
    phoneNumber = this.normalizeNumber(phoneNumber);
    var index = team.members.indexOf(phoneNumber);
    if(index == -1)
    {
        logger.debug("Team member not found on team.", { team: team.name, number: phoneNumber });
        return false;
    }

    logger.debug("Pausing team member", { team: team.name, number: phoneNumber });
    team.members.splice(index, 1);
    team.inactiveMembers.push(phoneNumber);

    _.pull(team.membersToMessage, phoneNumber);

    await this.updateTeam(team);
    return true;
};

TeamManager.prototype.resumeTeamMember = async function(team, phoneNumber)
{
    phoneNumber = this.normalizeNumber(phoneNumber);
    var index = team.inactiveMembers.indexOf(phoneNumber);
    if(index == -1)
    {
        logger.debug("Inactive team member not found on team.", { team: team.name, number: phoneNumber });
        return false;
    }

    logger.debug("Resuming team member", { team: team.name, number: phoneNumber });
    team.inactiveMembers.splice(index, 1);
    team.members.push(phoneNumber);
    team.nextUpdate = getNextUpdate(5);

    await this.updateTeam(team);
    return true;
};

TeamManager.prototype.normalizeNumber = function(rawNumber)
{
    if(!rawNumber)
    {
        throw "You must specify a phone number to normalize";
    }

    var number = rawNumber.replace(/[^0-9]+/g, "");

    if(number[0] === "1" && number.length == 11)
    {
        number = number.substring(1);
    }

    if(number.length != 10)
    {
        throw `Invalid phone number '${rawNumber}'`;
    }

    return "+1" + number;
};

TeamManager.prototype.generateReferralCode = function(length = 4, chars = "ABCDEFGHJKMNPQRSTUVWXYZ")
{
    var code = "";
    var max = chars.length;

    for(var i = 0; i < length; i++)
    {
        code += chars.charAt(Math.floor(Math.random() * max));
    }

    return code;
};

function getNextUpdate(updateDelaySeconds)
{
    var now = new Date();
    var nextUpdate = new Date(now);
    nextUpdate.setSeconds(now.getSeconds() + updateDelaySeconds);

    return nextUpdate;
}