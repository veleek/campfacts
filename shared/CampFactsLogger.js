var winston = require('winston');
require('winston-azure').Azure;
require('winston-mongo').MongoDB;

const collectionName = 'logs';

var logsCollection = null;
const DbHelper = require('./DbHelper');
const dbHelper = DbHelper.Create();
dbHelper.then(helper => {
    logsCollection = helper.collection(collectionName);
});


exports.azureOptions = {
    level: 'debug',
    account: process.env.AZURE_STORAGE_ACCOUNT,
    key: process.env.AZURE_STORAGE_KEY,
    table: collectionName,
    columns: true,
};
exports.azureTransport = new winston.transports.Azure(exports.azureOptions);

exports.mongoOptions = {
    level: 'debug',
    db: dbHelper.then(helper => helper.db),
    collection: collectionName,
    decolorize: true,
};
exports.mongoTransport = new winston.transports.MongoDB(exports.mongoOptions);

const logger = exports.winston = new winston.Logger({
    level: 'debug',
    transports: [
        new winston.transports.Console({colorize: true, timestamp: true}),
        exports.mongoTransport
        //new winston.transports.Azure(exports.azureOptions)
    ]
});

exports.log = function(message, data, level = 'info')
{
    logger.log(level, message, data);
};

exports.verbose = function(message, data)
{
    exports.log(message, data, 'verbose');
};

exports.debug = function(message, data)
{
    exports.log(message, data, 'debug');   
};

exports.info = function(message, data)
{
    exports.log(message, data, 'info');   
};

exports.warn = function(message, data)
{
    exports.log(message, data, 'warn');   
};

exports.error = function(message, data)
{
    exports.log(message, data, 'error');   
};

exports.query = async function(query, count = 50, start = 0)
{
    if(!logsCollection)
    {
        return new Error("Logs collection not initialized yet");
    }

    return logsCollection.find(query).skip(start).limit(count).sort({ timestamp:-1 }).toArray();
};