var Handlebars = require("handlebars/runtime");
require("./views/_base");
require("./views/_message");
require("./_helpers");

module.exports = {

    path: '/dashboard/message',
    method: 'GET',

    respond: async function (req, res)    
    {
        res.type('html');
        res.send(Handlebars.partials["message"]({}));
    }
};
