var MongoClient = require("mongodb").MongoClient;

const dbName = 'campfacts';
const DefaultConnectionString = "mongodb://localhost:C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==@localhost:10255/admin?ssl=true";

const mongoClients = {};

function DbHelper(client)
{
    this.client = client;
    this.db = this.client.db(dbName);
}

module.exports = DbHelper;

module.exports.Create = async function(connectionString)
{
    if(!connectionString)
    {
        connectionString = DefaultConnectionString;
    }

    var client = mongoClients[connectionString];

    if(!client)
    {
        // We're storing the connection "promise" here.  So that other callers can
        // have access to it right away.  Then we'll await on the promise to 
        // actually construct the helper later.
        client = MongoClient.connect(connectionString);
        mongoClients[connectionString] = client;
    }

    return new DbHelper(await client);
};

DbHelper.prototype.collection = function(collectionName)
{
    return this.db.collection(collectionName);
};