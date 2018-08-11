const logger = require("../shared/CampFactsLogger");

var TeamManager = require("../shared/TeamManager.js");
var TeamStates = TeamManager.TeamStates;
var GameManager = require("../shared/GameManager.js");

var teamManager;
var gameManager;

(async function Initialize()
{
    teamManager = await TeamManager.Create();
    gameManager = await GameManager.Create(teamManager);

    // Start the processing loop
    processTeams();
})();

async function processTeams()
{
    try
    {
        var now = new Date();
        var updateCutoff = new Date(now);
        updateCutoff.setSeconds(now.getSeconds() - 5);

        var teamsFilter = 
        {
            $and: [
                { lastUpdated: { $lt: updateCutoff} },
                { $or: [ 
                    { nextUpdate: null }, 
                    { nextUpdate : { $lt: now } } 
                ]},
                // We only need to continually process teams in these three states.
                { state: { $in: [ TeamStates.Basic, TeamStates.Referral, TeamStates.Premium ] } }
            ]
        };

        var teams = await teamManager.getTeams(teamsFilter);

        for(var i = 0; i < teams.length; i++)
        {
            var team = teams[i];
            await gameManager.processTeam(team);
        }
    }
    catch(error)
    {
        logger.error("Error while processing teams.", { error: error });
    }
    finally
    {
        // Check for more messages after a short delay.
        setTimeout(processTeams, 1000);
    }
};

logger.verbose("Process Teams worker is running...");
