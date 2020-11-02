const { Items } = require("../src/classes/mapTiles/mapTile");

const Hunger = {
    gather: 1,
    move: 2,
};

const CraftMenu = {
    Fiber: {
        materials: {
            [Items.wood]: 1,
        },
        onlyOneAllowed: false,
        isBaseItem: false,
    },
    Rope: {
        materials: {
            [Items.fiber]: 20,
        },
        onlyOneAllowed: false,
        isBaseItem: false,
    },
    Armor: {
        materials: {
            [Items.sticks]: 5,
            [Items.rope]: 5,
        },
        onlyOneAllowed: true,
        isBaseItem: false,
    },
    Shelter: {
        materials: {
            [Items.stone]: 10,
            [Items.sticks]: 20,
            [Items.wood]: 10,
            [Items.leaves]: 30,
        },
        onlyOneAllowed: true,
        isBaseItem: true,
    },
    'Drying-Rack': {
        materials: {
            [Items.stone]: 5,
            [Items.sticks]: 15,
            [Items.wood]: 5,
        },
        onlyOneAllowed: true,
        isBaseItem: true,
    },
};

const FlammableItems = {
    [Items.sticks]: 1,
    [Items.leaves]: 1,
    [Items.wood]: 5,
    [Items.rope]: 4,
    [Items.coal]: 10,
};

const sendStandardMessage = (client, msg, message) => {
    if (client) {
        return client.createMessage(msg.channel.id, {
            embed: {
                title: message,
                author: { // Author property
                    name: msg.author.username,
                    icon_url: msg.author.avatarURL
                },
                color: 0x008000, // Color, either in hex (show), or a base-10 integer
            }
        });
    }
    return message;
}

const mockClient = {
    createMessage(msg, obj) {
        console.log('sending msg: ', JSON.stringify(obj));
    },
    channel: {
        createMessage(msg, obj) {
            console.log('sending msg: ', JSON.stringify(obj));
        }
    }
};

module.exports = {
    Hunger,
    CraftMenu,
    FlammableItems,
    sendStandardMessage,
    mockClient,
};
