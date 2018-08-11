const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars/runtime");
const TeamManager = require("../../shared/TeamManager.js");

var fileContentCache = {};

function selectHelper(value, selectOptions)
{
    var result = "";

    if(!Array.isArray(selectOptions))
    {
        selectOptions = [selectOptions];
    }

    selectOptions.forEach(element => {
        if(element == value)
        {
            result += `<option value="${element}" selected>${element}</option>\n`;
        }
        else
        {
            result += `<option value="${element}">${element}</option>\n`;
        }
    });

    return result;
}

Handlebars.registerHelper('select', selectHelper);
Handlebars.registerHelper('stateSelect', function(value) { return selectHelper(value, Object.getOwnPropertyNames(TeamManager.TeamStates)); });

Handlebars.registerHelper('array', function() { return Array.prototype.slice.call(arguments, 0, -1); });

Handlebars.registerHelper('equals', function(a, b, options) 
{
    if(a == b)
    {
        return options.fn(this);
    }
    else
    {
        return options.inverse(this);
    }
});

Handlebars.registerHelper('file', function(filePath){

    var fileContent = fileContentCache[filePath];
    if(!fileContent)
    {
        fileContent = fs.readFileSync(path.join(__dirname, filePath));
        fileContentCache[filePath] = fileContent;
    }

    return fileContent;
});