
require('dotenv').config();

const Commands = require('./src/commands');
const PREFIX = '!';
const db = require('./src/db');
const BonfireCache = require("./src/bonfireCache");
const Models = require("./src/db/models");
const input = process.argv.slice(-1)[0]?.toUpperCase();
const readline = require('readline');
const { mockClient } = require("./utils");

// Eris setup
const eris = require("eris");
const discordEnvironment = `DISCORD_TOKEN_${process.argv.slice(-1)[0]?.toUpperCase()}`;
const token = process.env[discordEnvironment];
const client = input !== "DEVELOP"
    ? new eris.Client(token)
    : null;

// Cache setup
const bonfireCache = new BonfireCache(db, client); 
const commands = new Commands(bonfireCache);  

async function getOrCreateBonfire() {
    return await bonfireCache.createBonfire().catch((err) => console.warn(err));
}

async function handleMessage(client, msg, name, isDeveloping = false) {
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
                return handleMessage(client, null, name, true);
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
                            message = await commandLookup.call(this, client, null, user, ...args);
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
            handleMessage(client, null, name, true);
        });
    } else {
        const botWasMentioned = msg.content.startsWith(PREFIX);

        if (botWasMentioned) {
            await msg.channel.sendTyping();
            const [command, ...args] = msg.content.slice(1).split(" ");

            if (!commands.commandList.hasOwnProperty(command)) {
                client.createMessage(msg.channel.id, {
                    embed: {
                        title: `:interrobang: Unknown command.`, // Title of the embed
                        author: { // Author property
                            name: msg.author.username,
                            icon_url: msg.author.avatarURL
                        },
                        color: 0x008000, // Color, either in hex (show), or a base-10 integer
                        fields: [ // Array of field objects
                            {
                                name: "Some extra info.", // Field title
                                value: "Some extra value.", // Field
                                inline: true // Whether you want multiple fields in same line
                            },
                            {
                                name: "Some more extra info.",
                                value: "Another extra value.",
                                inline: true
                            }
                        ],
                        footer: { // Footer text
                            text: "Created with Eris."
                        }
                    }
                });
            } else {
                const commandLookup = commands.commandList[command];
                try {
                    let message = "Unknown command.";
                    if (commandLookup) {
                        const user = await bonfireCache.getUser(msg.member.username);
                        try {
                            return await commandLookup.call(this, client, msg, user, ...args);
                        } catch (err) {
                            console.warn(`error processing request: ${err}`);
                            message = 'Houston, we have a problem.';
                        }
                        user.lastPrompt = command;
                    }
                    // await msg.channel.createMessage(message);
                } catch (err) {
                    console.warn(`Had an err, boss: ${err}`);
                }
            }
        }
    }
}

if (input === "DEVELOP") {
    console.log('we are developing.');
    handleMessage(mockClient, null, null, true);
} else {
    client.on('ready', async () => {
        getOrCreateBonfire();

        client.on('messageCreate', async (msg) => {
            handleMessage(client, msg, null, false);
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