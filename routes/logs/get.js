const TeamManager = require("../../shared/TeamManager.js");
const teamManager = TeamManager.Create();
const logger = require("../../shared/CampFactsLogger");

module.exports = {
    
    path: "/logs/:name?",
    method: "GET",
    
    respond: async function (req, res) {

        var filter = {};
        if(req.params.name && req.params.name.toLowerCase() != 'all')
        {
            var tm = await teamManager;
            var team = await tm.getTeam(req.params.name);
            if(!team)
            {
                res.status(400).send(`Team '${req.params.name}' does not exist.`);
                return;
            }

            filter["meta.team"] = { $exists: true, $eq : req.params.name };
        }

        if(req.query.level)
        {
            if(!Array.isArray(req.query.level))
            {
                req.query.level = req.query.level.split(",");
            }

            filter["level"] = { $in : req.query.level };
        }

        var count = req.query.count ? parseInt(req.query.count) : 50;
        var start = req.query.start ? parseInt(req.query.start) : 0;

        var logs = await logger.query(filter, count, start);
        res.send(logs);
    }
};

