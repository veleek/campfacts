var _ = require("lodash");
var Handlebars = require("handlebars/runtime");
require("./views/_base.js");
require("./views/_team.js");
require("./_helpers");

var TeamManager = require("../../shared/TeamManager.js");
var teamManager = TeamManager.Create();

module.exports = {
    
    path: '/dashboard/team',
    method: 'GET',

    respond: async function (req, res) {
        var tm = await teamManager;
        var teams = await tm.getTeams();

        var data = {
            selectedTeam: req.query.name,
            teamNames: _.map(teams, t => t.name),
        };

        res.type('html');
        res.send(Handlebars.partials["team"](data));
    }
};