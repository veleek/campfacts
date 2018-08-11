'use strict';
 
const path = require('path');
const express = require('express'); 
const router = require('./router');
const basicAuth = require('express-basic-auth');
const bodyParser = require('body-parser');
const logger = require('./shared/CampFactsLogger.js');
const winston = require('winston');
const expressWinston = require('express-winston');

const { fork }= require('child_process');

logger.verbose("Starting CampFacts!");

process.env.DEBUG = 'express:*';

const app = express();

const users = { 'test': 'test'};

app.use(expressWinston.logger({
    transports: [
        new winston.transports.Console({level: 'warn', colorize: true, timestamp: true}),
        logger.mongoTransport
    ],
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    msg: "HTTP {{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: false, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    /*
    statusLevels: {
        "success": "verbose",
        "warn": "warn",
        "error": "error"
    },
    */
    level: function (req, res) {
        var level = "";
        if (res.statusCode >= 100) { level = "verbose"; }
        if (res.statusCode >= 400) { level = "warn"; }
        if (res.statusCode >= 500) { level = "error"; }
        // 401s occur on most twilio requests resulting in a second call with creds so ignore them
        if (res.statusCode == 401) { level = "verbose"; }
        return level;
    }
  }));

app.use(basicAuth({ users: users, challenge: true, realm: "CampFacts!" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//router.enableDebug({});

// Finally, create routes by padding the path where they're stored
router.create(app, path.resolve("./routes"));

function startWorker(name, path)
{
    logger.verbose(`Launching worker '${name}' from ${path}.`);
    var worker = fork(path);
    worker.on('exit', e => {
        logger.warn(`Worker '${name}' exited with message: ${e}.  Restarting...`);
        worker = startWorker(name, path); 
        logger.warn("Done!");
    });
    worker.on('message', (m) => { logger.debug(`Got message from ${name} worker: ${m}`); });

    return worker;
}

try
{
    startWorker("ProcessMessages", './worker/process-message.js');
    startWorker("ProcessTeams", './worker/process-teams.js');
}
catch(e)
{
    logger.error("Error: " + e);
}

var port = process.env.PORT || 1337;
app.listen(port);
logger.verbose(`Server running at http://localhost:${port}`);