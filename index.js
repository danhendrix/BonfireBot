
require('dotenv').config();
let client;

const Commands = require('./src/commands');
const PREFIX = '!';
const db = require('./src/db');
const BonfireCache = require("./src/bonfireCache");
const bonfireCache = new BonfireCache(db, client);
const commands = new Commands(bonfireCache);
const Models = require("./src/db/models");
const input = process.argv.slice(-1)[0]?.toUpperCase();
const readline = require('readline');
const eris = require("eris");

async function getOrCreateBonfire() {
    return await bonfireCache.createBonfire().catch((err) => console.warn(err));
}

async function handleMessage(msg, name, isDeveloping = false) {
    if (isDeveloping) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false,
        });

        if (!name) {
            rl.question('What is your name? ', (answer) => {
                name = answer;
                console.log(`Oh, hi ${name}\n\n`);
                return handleMessage(null, name, true);
            });
        }

        rl.question('What would you like to do? ', async (answer) => {
            console.log(`answer? \n`, answer)
            const [command, ...args] = answer.slice(1).split(" ");

            if (!commands.commandList.hasOwnProperty(command)) {
                console.log("Unknown command.");
            } else {
                const commandLookup = commands.commandList[command];
                try {
                    let message = "Unknown command.";
                    if (commandLookup) {
                        const user = await bonfireCache.getUser(name);
                        try {
                            message = await commandLookup.call(this, user, ...args);
                        } catch (err) {
                            console.warn(`error processing request: ${err}`);
                            message = 'Houston, we have a problem.';
                        }
                        user.lastPrompt = command;
                    }
                    console.log(message);
                } catch (err) {
                    console.warn(`Had an err, boss: ${err}`);
                }
            }
            handleMessage(null, name, true);
        });
    } else {
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
    }
}

if (input === "DEVELOP") {
    console.log('we are developing.');
    handleMessage(null, null, true);
} else {
    const discordEnvironment = `DISCORD_TOKEN_${process.argv.slice(-1)[0]?.toUpperCase()}`;
    const token = process.env[discordEnvironment];
    let client = new eris.Client(token);

    client.on('ready', async () => {
        getOrCreateBonfire();

        client.on('messageCreate', async (msg) => {
            handleMessage(msg, false);
        });

        client.on('error', (error) => {
            console.warn(error);
        });

        client.on('guildMemberAdd', async (guild, member) => {
            await msg.channel.createMessage(`Hello ${member.name}! Welcome to BonfireBot!`);
        });
    });

    client.connect();
}

module.exports = {
    bonfireCache,
}