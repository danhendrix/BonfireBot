## Contributing to Bonfire Bot

If you'd like to contribute, let's start by getting the bot running locally on your machine.

### Requirements
+ Node
+ Yarn
+ MongoDB
+ Text Editor (VSCode recommended)
+ Git

### Getting Started
+ First, start by forking the repo
+ Once you have the code, navigate to the project folder in your terminal and run `yarn`.
    - This will install any needed dependencies
+ Run `yarn develop` to run the bot locally without connecting to Discord.
+ If you'd like to run the bot in your own server, follow these steps:
    - Create a bot in your Discord settings and note your bot token
    - Add a `.env` file to the root of the project and add a line like this:
        - `DISCORD_TOKEN_NAMEOFYOURSERVER = YOURTOKEN`
        - At the console run `yarn start`.
        - You should now see your bot running in your discord server.
        

### Contributing
+ Check open issues and assign yourself if it's something you'd like to do
+ Add issues if you notice bugs, and assign yourself if you'd like to fix
+ Submit a PR against master
+ That's it!
