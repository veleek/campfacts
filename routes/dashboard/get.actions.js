var Handlebars = require("handlebars/runtime");
require("./views/_base");
require("./views/_actions");
require("./_helpers");

module.exports = {
    
    path: '/dashboard/actions',
    method: 'GET',

    respond: async function (req, res) 
    {
        res.type('html');
        res.send(Handlebars.partials["actions"]({}));
    }
};