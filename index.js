require('dotenv').config()
const token = process.env.DISCORD_TOKEN;
const Commands = require('./src/commands');
const eris = require("eris");
const client = new eris.Client(token);
const PREFIX = '!';
const db = require('./src/db');
const BonfireCache = require("./src/bonfireCache");
const bonfireCache = new BonfireCache(db);
const commands = new Commands(bonfireCache);
const Models = require("./src/db/models");

client.on('ready', async () => {
    await bonfireCache.createBonfire().catch((err) => console.warn(err));
    // await bonfireCache.createMaptiles().catch((err) => console.warn(`Error creating maptiles: ${err}`));
    console.log('bonfire? ', bonfireCache.bonfire)

    // client.on('userUpdate')

    client.on('messageCreate', async (msg) => {
        const botWasMentioned = msg.content.startsWith(PREFIX);

        if (botWasMentioned) {
            await msg.channel.sendTyping();
            let messageCommandSplit = msg.content.slice(1, 2);
            if (!commands.commandList.hasOwnProperty(messageCommandSplit)) {
                messageCommandSplit = msg.content.slice(1);
            }
            const messageCommandContent = msg.content.slice(2);
            const command = messageCommandSplit && commands.commandList[messageCommandSplit];
            try {
                let message = "Unknown command.";
                if (command) {
                    const user = await bonfireCache.getUser(msg.member.username);
                    console.log('got user: ', user.name)
                    try {
                        message = await command.call(this, user, messageCommandContent);
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
    });

    client.on('error', (error) => {
        console.warn(error);
    });
});

client.connect();


// setTimeout(() => {
//     client.();
// }, 50000);

module.exports = {
    bonfireCache,
}