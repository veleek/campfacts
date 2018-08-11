var Handlebars = require("handlebars/runtime");
require("./views/_base.js");
require("./views/_dashboard.js");
require("./_helpers");

var TeamManager = require("../../shared/TeamManager.js");
var teamManager = TeamManager.Create();

module.exports = {
    
    path: '/dashboard',
    method: 'GET',

    respond: async function (req, res) {
        var tm = await teamManager;
        var teams = await tm.getTeams();

        var data = {
            teams: teams,
        };

        res.type('html');
        res.send(Handlebars.partials["dashboard"](data));
    }
};