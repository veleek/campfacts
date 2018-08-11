var TeamManager = require("../../shared/TeamManager.js");
var teamManager = TeamManager.Create();

module.exports = {
    
    path: "/teams/:name?",
    method: "GET",
    
    respond: async function (req, res) {

        var tm = await teamManager;

        var result;
        if(req.params.name)
        {
            result = await tm.getTeam(req.params.name);
        }
        else
        {
            result = await tm.getTeams();
        }

        res.send(result);
    }
};

