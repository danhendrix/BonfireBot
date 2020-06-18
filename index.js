require('dotenv').config();
const discordEnvironment = `DISCORD_TOKEN_${process.argv.slice(-1)[0]?.toUpperCase()}`;
const token = process.env[discordEnvironment];
const Commands = require('./src/commands');
const eris = require("eris");
const client = new eris.Client(token);
const PREFIX = '!';
const db = require('./src/db');
const BonfireCache = require("./src/bonfireCache");
const bonfireCache = new BonfireCache(db, client);
const commands = new Commands(bonfireCache);
const Models = require("./src/db/models");

client.on('ready', async () => {
    await bonfireCache.createBonfire().catch((err) => console.warn(err));

    client.on('messageCreate', async (msg) => {
        const botWasMentioned = msg.content.startsWith(PREFIX);

        if (botWasMentioned) {
            await msg.channel.sendTyping();
            const [command, ...args] = msg.content.slice(1).split(" ");

            if (!commands.commandList.hasOwnProperty(command)) {
                msg.channel.createMessage("Unknown command.");
            } else {
                const commandLookup = commands.commandList[command];
                try {
                    let message = "Unknown command.";
                    if (commandLookup) {
                        const user = await bonfireCache.getUser(msg.member.username);
                        try {
                            message = await commandLookup.call(this, user, ...args);
                        } catch (err) {
                            console.warn(`error processing request: ${err}`);
                            message = 'Houston, we have a problem.';
                        }
                        user.lastPrompt = command;
                    }
                    await msg.channel.createMessage(message);
                } catch (err) {
                    console.warn(`Had an err, boss: ${err}`);
                }
            }
        }
    });

    client.on('error', (error) => {
        console.warn(error);
    });

    client.on('guildMemberAdd', async (guild, member) => {
        await msg.channel.createMessage(`Hello ${member.name}! Welcome to BonfireBot!`);
    });
});

client.connect();

module.exports = {
    bonfireCache,
}