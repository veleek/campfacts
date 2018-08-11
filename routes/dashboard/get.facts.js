var Handlebars = require("handlebars/runtime");
require("./views/_base");
require("./views/_facts");
require("./_helpers");

var GameManager = require("../../shared/GameManager");

module.exports = {

    path: '/dashboard/facts',
    method: 'GET',

    respond: async function (req, res)
    {
        var data = {
            facts: GameManager.facts,
            factsLookup: GameManager.factsLookup,
        };

        res.type('html');
        res.send(Handlebars.partials["facts"](data));
    }
};