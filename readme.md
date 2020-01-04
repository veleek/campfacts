# CampFacts!

This repository contains the source code for CampFacts! A puzzle that ran as part of the [2018 Microsoft Intern Game](https://interngame.microsoft.com/events/2018/).  It is loosely based on an [old joke from a reddit thread](https://www.reddit.com/r/funny/comments/owx3v/so_my_little_cousin_posted_on_fb_that_he_was/).  

The main purpose of this puzzle was to come up with an excuse to spam the teams of interns with text messages containing some hidden information for as long as they were trying to solve this puzzle.  Some earlier iterations of this puzzle had no way of stopping messages until the team had completed it.  

## Walkthrough

The full detail of this puzzle can be found at [the 2018 Intern Game - Camp Northwind wrap up](https://interngame.microsoft.com/events/2018/camp-facts-exclamation/overview/).

## Technology

This project uses a wide variety of tech including:

* [Twilio](https://twilio.com) - for sending and recieving SMS and MMS messages.
* [NodeJS](https://nodejs.org)/[Express](https://expressjs.com) - Most of the processing for the app
  * Express hosted HTTP service for all endpoints.
  * Recieving and processing incoming messages from Twilio and pushing them to queues.
  * Background workers for updating team progress and processing messages and images.
  * Serve all Dashboard UI.
* [Handlebars.js](https://handlebarsjs.com) - Simple templating for dashboard UI.
* [Bootstrap](https://getbootstrap.com/) - Dashboard UI framework.
* [Azure Queues](https://azure.microsoft.com/en-us/services/storage/queues/) - to store messages for processing
* [Azure Web App](https://azure.microsoft.com/en-us/services/app-service/web/) - Web hosting for the app.
* [Azure CosmosDb](https://azure.microsoft.com/en-us/services/cosmos-db/) - Storing team data and logs
* [Google Vision](https://cloud.google.com/vision/) - Process recieved memes to determine if they were cat memes.
* [VSCode](https://code.visualstudio.com/) - Main editor for project including a variety of script and task integration to simplify development tasks like pre-processing `.handlebars` templates.
* [Visual Studio Team Services](https://visualstudio.microsoft.com/team-services/) - Hosting for source code during development and execution of event.

This repository has been cleaned of private data include API keys and connection strings, so unfortunately it will not run out of the box.  In it's current state you should be able to get it running locally pretty since it is configured to use the Azure Storage and CosmosDB emulators.  However, Twilio and Google API credentials will be needed for any of that functionality.  

### Dashboard Home

![Dashboard Home](https://raw.githubusercontent.com/veleek/campfacts/clean/dashboard_home.png)

### Dashboard Team Details

![Dashboard Team Details](https://raw.githubusercontent.com/veleek/campfacts/clean/dashboard_details.png)
