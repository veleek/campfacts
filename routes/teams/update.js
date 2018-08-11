var querystring = require("querystring");

var logger = require("../../shared/CampFactsLogger");
var TeamManager = require("../../shared/TeamManager.js");
var teamManager = TeamManager.Create();

module.exports = {
    path: "/teams/:name",
    method: "POST",

    respond: async function(req, res)
    {
        var body;

        try
        {
            if(typeof req.body === "string")
            {
                var rawContentType = req.headers["content-type"].split(';')[0];
                switch(rawContentType)
                {
                    case "text/json":
                    case "application/json":
                        body = JSON.parse(req.body);
                        break;
                    case "application/x-www-form-urlencoded":
                        body = querystring.parse(req.body);
                        break;
                    default:
                        throw `Unsupported Content-Type '${req.headers["content-type"]}'.`;
                }
            }
            else
            {
                body = req.body;
            }
        }
        catch(err)
        {
            res.status(400).send("Invalid request body. " + err);
            return;
        }

        try
        {
            if(!req.params.name)
            {
                res.status(400).send("No team specified");
                return;
            }

            var tm = await teamManager;
            var team = await tm.getTeam(req.params.name);

            if(req.query.create == "true")
            {
                if(team)
                {
                    res.status(400).send(`Team '${req.params.name}' already exists.`);
                    return;
                }

                await tm.createTeam(req.params.name);
                res.status(201).end();
                return;
            }

            if(!team)
            {
                res.status(400).send(`Team '${req.params.name}' does not exist.`);
                return;
            }

            if(req.query.action == "addMember")
            {
                await tm.addTeamMember(team, req.query.member);
                res.status(204).end();
                return;
            }

            if(req.query.action == "removeMember")
            {
                await tm.removeTeamMember(team, req.query.member);
                res.status(204).end();
                return;
            }

            if(!body)
            {
                res.status(400).send("Empty request body.");
                return;
            }

            logger.info("Updating team", { team: team.name, body: body });
            var updatedTeam = await tm.updateTeam(team, body, req.get('if-match'));
            res.send(updatedTeam);
        }
        catch(err)
        {
            res.status(500).send(err.stack);
        }
    }
};