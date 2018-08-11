var TeamManager = require("../../shared/TeamManager.js");
var teamManager = TeamManager.Create();

module.exports = {
    path: "/teams/:name",
    method: "DELETE",

    respond: async function(req, res)
    {
        if(!req.params.name)
        {
            res.status(400).send("No team specified");
            return;
        }

        var tm = await teamManager;
        var team = await tm.getTeam(req.params.name);
        
        if(!team)
        {
            res.status(400).send(`Team '${req.params.name}' does not exist.`);
            return;
        }

        try
        {
            await tm.deleteTeam(team);
        }
        catch(err)
        {
            // We don't care about errors deleting teams, probably already deleted.
        }

        res.end();
    }
};