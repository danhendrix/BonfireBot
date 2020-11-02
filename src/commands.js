const Models = require("./db/models");
const { CraftMenu, Hunger, FlammableItems, sendStandardMessage } = require("../utils");
const Locations = require("./classes/mapTiles");
const { ForageItems, Items } = require("./classes/mapTiles/mapTile");
const emojis = require('../utils/emojis');
const emojiLookup = require("../utils/emojis");

const standardMenu = {
    base: "Shows current structures built in your base.",
    craft: "Shows crafting menu.",
    drop: "Drops item.",
    eat: "Self-explanatory :)",
    fire: "Shows bonfire menu.",
    forage: "Look for edible items.",
    gather: "Look for useful items.",
    move: "Move to new location. Here are your choices: (F)orest (M)ountains (G)rasslands (B)each",
    status: "Show current player status.",
};

class Commands {
    constructor(bonfireCache) {
        this.bonfireCache = bonfireCache;
        this.commandList = {
            base: this.base,
            b: this.base,
            // TODO add these back
            // craft: this.craft,
            // c: this.craft,
            d: this.drop,
            drop: this.drop,
            dry: this.dry,
            eat: this.eat,
            e: this.eat,
            fire: this.fire,
            f: this.fire,
            forage: this.forage,
            f: this.forage,
            gather: this.gather,
            g: this.gather,
            help: this.displayHelp,
            h: this.displayHelp,
            menu: this.displayHelp,
            move: this.move,
            m: this.move,
            status: this.displayStatus,
            s: this.displayStatus,
        };
    }

    base = (client, msg) => {
        return client.createMessage(msg?.channel?.id, {
            embed: {
                title: "Your base:", // Title of the embed
                author: { // Author property
                    name: msg?.author?.username,
                    icon_url: msg?.author?.avatarURL
                },
                color: 0x008000, // Color, either in hex (show), or a base-10 integer
                fields: Object.entries(this.bonfireCache.base?.inventory).map(([key, val]) => ({
                    name: key,
                    value: val,
                })),
            },
        });
    }

    drop = async (client, msg, user, item, amount) => {
        if (!item || (amount && typeof +amount !== "number")) {
            return sendStandardMessage(client, msg, "Must specify item and valid number. To drop all items of specified type leave amount blank.");
        }

        let formattedCommand = item.split('-').map((splitItem) => splitItem.charAt(0).toUpperCase() + splitItem.slice(1).toLowerCase()).join("-");
        if (!user.inventory.hasOwnProperty(formattedCommand)) {
            return sendStandardMessage(client, msg, "You don't have any of those.");
        }


        user.inventory[formattedCommand] -= Math.min((amount || user.inventory[formattedCommand]), user.inventory[formattedCommand]);
        await this.bonfireCache.updateUser(user);
        return sendStandardMessage(client, msg, "Dropped.");
    }

    dry = async (user, arg) => {
        if ("Drying-Rack" in this.bonfireCache.base.inventory === false) {
            return "You do not have a drying rack.";
        }
        
        const wetWood = user.inventory[Items.wetWood];
        if (!wetWood) {
            return "You do not have any wet wood to dry.";
        }
        if (!!arg && isNaN(+arg)) {
            return "Must be a valid number.";
        }
        user.inventory = {
            ...user.inventory,
            [Items.wood]: user.inventory[Items.wood] + (arg ? Math.min(+arg, wetWood) : wetWood),
        };
        if (arg) {
            user.inventory[Items.wetWood] -= Math.min(+arg, wetWood);
        } else {
            delete user.inventory[Items.wetWood];
        }
        return this.bonfireCache.updateUser(user, "Wood is now dry.");
    }

    eat = async (client, msg, user, command, amountToEat) => {
        console.log('eating')
        const edibleItems = Object.values(ForageItems).filter((item) => user.inventory.hasOwnProperty(item));
        let howHungry = user.hunger;
        let amountOnHand = amountToEat || Object.entries(user.inventory).reduce((all, [key, val]) => {
            if (edibleItems.includes(key)) all += val;
            return all;
        }, 0);

        switch (command) {
            case 'all': {
                console.log('edible? ', edibleItems)
                console.log('amountonhand? ', amountOnHand)
                if (howHungry > amountOnHand) {
                    user.hunger -= amountOnHand;
                    Object.values(ForageItems).forEach((item) => {
                        user.inventory[item] = 0;
                    });
                    await this.bonfireCache.updateUser(user);
                    return sendStandardMessage(client, msg, "Yum!")
                } else {
                    const eatMessage = await this.findFoodToEat(user, amountOnHand, howHungry, amountOnHand, edibleItems);
                    return sendStandardMessage(client, msg, eatMessage);
                }
            }
            default: {
                const eatMessage = await this.findFoodToEat(user, 10, howHungry, amountOnHand, edibleItems);
                return sendStandardMessage(client, msg, eatMessage);
            }
        }
    }

    async findFoodToEat(user, max, howHungry, amountOnHand, edibleItems) {
        let count = 0;
        let foodTypeIndex = 0;
        while (amountOnHand && howHungry && (count < max) && (edibleItems.length > foodTypeIndex)) {
            // amount of food for current inventory item
            let foodLookup = user.inventory[edibleItems[foodTypeIndex]];

            // eat all the food or up to 10 or up to hunger level
            const eatAmount = Math.min(foodLookup, howHungry, (10 - count));

            // set new hunger level
            user.hunger -= eatAmount;
            howHungry -= eatAmount;
            // in user inventory
            user.inventory[edibleItems[foodTypeIndex]] -= eatAmount;

            count += eatAmount;
            amountOnHand -= eatAmount;

            foodTypeIndex++;
        }
        await this.bonfireCache.updateUser(user);
        return `Yum! Ate ${count} food`;
    }

    fire = async (client, msg, user, command, type, amount) => {
        if (user.location.name !== "Beach") {
            return client.createMessage(msg?.channel?.id, {
                embed: {
                    title: "Not available from your location.",
                    author: { // Author property
                        name: msg?.author?.username,
                        icon_url: msg?.author?.avatarURL
                    },
                    color: 0x008000, // Color, either in hex (show), or a base-10 integer
                }
            });
        }
        if (!command) {
            return client.createMessage(msg?.channel?.id, {
                embed: {
                    title: "Bonfire command required.",
                    author: { // Author property
                        name: msg?.author?.username,
                        icon_url: msg?.author?.avatarURL
                    },
                    color: 0x008000, // Color, either in hex (show), or a base-10 integer
                }
            });
        }
        let message;
        switch (command.toUpperCase()) {
            case "MENU": {
                return client.createMessage(msg?.channel?.id, {
                    embed: {
                        title: `(Status) - Display status of bonfire.\n(Add #) - Add wood to the fire.`,
                        author: { // Author property
                            name: msg?.author?.username,
                            icon_url: msg?.author?.avatarURL
                        },
                        color: 0x008000, // Color, either in hex (show), or a base-10 integer
                    }
                });
            }
            case "STATUS":
                return client.createMessage(msg?.channel?.id, {
                    embed: {
                        title: `Fire Level ${emojiLookup.FIRE}`,
                        author: { // Author property
                            name: msg?.author?.username,
                            icon_url: msg?.author?.avatarURL
                        },
                        color: 0x008000, // Color, either in hex (show), or a base-10 integer,
                        fields: [
                            {
                                name: "Fire Level",
                                value: this.bonfireCache.bonfire.fireLevel,
                            },
                            {
                                name: "Rescue Time",
                                value: this.bonfireCache.bonfire.rescueTime,
                            },
                        ]
                    }
                });
            case "ADD": {
                if (amount && (isNaN(amount) || amount < 1)) {
                    return client.createMessage(msg?.channel?.id, {
                        embed: {
                            title: "Must specify valid amount to add",
                            author: { // Author property
                                name: msg?.author?.username,
                                icon_url: msg?.author?.avatarURL
                            },
                            color: 0x008000, // Color, either in hex (show), or a base-10 integer
                        }
                    });
                }
                type = type && type.charAt(0).toUpperCase() + type.slice(1);
                let fireAddition;
                const flammableItemKeys = Object.keys(FlammableItems);
                amount = isNaN(+amount)
                    ? null
                    :+amount;

                if (!type) {
                    const availableToBurn = Object.entries(user.inventory).reduce((all, [key, val]) => {
                        if (flammableItemKeys.includes(key)) {
                            all += (val * FlammableItems[key]);
                        }
                        return all;
                    }, 0);
                    if (!availableToBurn) {
                        return client.createMessage(msg?.channel?.id, {
                            embed: {
                                title: "You have nothing to add to the fire.",
                                author: { // Author property
                                    name: msg?.author?.username,
                                    icon_url: msg?.author?.avatarURL
                                },
                                color: 0x008000, // Color, either in hex (show), or a base-10 integer
                            }
                        });
                    }
                    flammableItemKeys.forEach((item) => {
                        user.inventory[item] = 0;
                    });
                    fireAddition = availableToBurn;
                } else {
                    if (!flammableItemKeys.includes(type)) {
                        return client.createMessage(msg?.channel?.id, {
                            embed: {
                                title: "That is not a flammable item.",
                                author: { // Author property
                                    name: msg?.author?.username,
                                    icon_url: msg?.author?.avatarURL
                                },
                                color: 0x008000, // Color, either in hex (show), or a base-10 integer
                            }
                        });
                    }
                    if (amount) {
                        if (user.inventory[type] < amount) {
                            return client.createMessage(msg?.channel?.id, {
                                embed: {
                                    title: "You do not have that much",
                                    author: { // Author property
                                        name: msg?.author?.username,
                                        icon_url: msg?.author?.avatarURL
                                    },
                                    color: 0x008000, // Color, either in hex (show), or a base-10 integer
                                }
                            });
                        }
                        user.inventory[type] -= amount;
                        fireAddition = FlammableItems[type] * amount;
                    } else {
                        fireAddition = FlammableItems[type] * user.inventory[type];
                        user.inventory[type] = 0;
                    }
                }
    
                await this.bonfireCache.bonfire.addToBonfire(fireAddition);
                message = `Added to fire. ${emojiLookup.FIRE} - ${this.bonfireCache.bonfire.fireLevel}`;
                await this.bonfireCache.updateUser(user, message)
                break;
            }
            default:
                message = "Unknown bonfire command.";
                break;
        }
        return client.createMessage(msg?.channel?.id, {
            embed: {
                title: message,
                author: { // Author property
                    name: msg?.author?.username,
                    icon_url: msg?.author?.avatarURL
                },
                color: 0x008000, // Color, either in hex (show), or a base-10 integer
            }
        });
    }

    displayHelp(client, msg, user) {
        const menu = JSON.parse(JSON.stringify(standardMenu));
        if (user.location.name === 'Beach') {
            menu['B'] = 'Bonfire - (S)tatus (A)dd(#)';
            menu['C'] = 'Craft - Type';
            menu["Base"] = 'Display Base';
        }
        return client.createMessage(msg?.channel?.id, {
            embed: {
                title: "Help!", // Title of the embed
                author: { // Author property
                    name: msg?.author?.username,
                    icon_url: msg?.author?.avatarURL
                },
                color: 0x008000, // Color, either in hex (show), or a base-10 integer
                fields: Object.entries(menu).map(([key, val]) => ({
                    name: key,
                    value: val,
                })),
            },
        });
    }

    craft = async (client, msg, user, command, arg) => {
        // TODO craft menu is broken, it needs to use the new embedded components
        if (!command || command.toUpperCase() === "MENU") {
            return Object.entries(CraftMenu).reduce((all, [material, inputObj]) => {
                all += `${material}:${Object.entries(inputObj.materials).map(([inputMaterial, inputQuantity]) => {
                    return `\n          ${inputMaterial} - ${inputQuantity}`;
                })}\n`;
                return all;
            }, "");
        } else {
            const cmd = command.split('-').map((item) => item.charAt(0).toUpperCase() + item.slice(1)?.toLowerCase()).join('-');
            console.log('cmd? ', cmd)
            if (!CraftMenu.hasOwnProperty(cmd)) {
                return "Invalid craft command.";
            } else if (CraftMenu[cmd].onlyOneAllowed) {
                if (user.inventory[cmd] === 1) {
                    return "You already have one of those.";
                } else if (
                    CraftMenu[cmd].isBaseItem
                    && this.bonfireCache.base.inventory[cmd] > 0
                ) {
                    return "The base already has one of those.";
                }
            }

            if (!!arg && isNaN(+arg)) {
                return "Amount must be a valid number.";
            }

            const amount = +arg || 1;
            console.log('amount? ', amount)
            // Valid craft command.
            const materials = CraftMenu[cmd].materials;
            const haveMaterials = Object.keys(materials).every((key) => {
                return user.inventory[key] >= (materials[key] * (amount ?? 1));
            });

            if (!haveMaterials) {
                return "You don't have enough materials for that. Check `!craft menu` for requirements.";
            }

            if (CraftMenu[cmd].isBaseItem) {
                this.bonfireCache.base.inventory[cmd] = 1;
                Object.entries(CraftMenu[cmd].materials).forEach(([name, val]) => {
                    user.inventory[name] -= val;
                });
                await this.bonfireCache.updateUser(user);
                await this.bonfireCache.updateBase(this.bonfireCache.base);

                return `The base now has a ${cmd}!`;
            } else {
                Object.entries(materials).forEach(([name, quantity]) => {
                    console.log('removing this much: ', quantity * amount)
                    user.inventory[name] -= (quantity * amount);
                });

                user.inventory[cmd] = ((user.inventory[cmd] ?? 0) + amount);
                await this.bonfireCache.updateUser(user);
                return `You did it!. Enjoy your new ${cmd}`;
            }
        }
    }

    forage = async (client, msg, user) => {
        return this.gather(client, msg, user, true);
    }

    checkStarved(client, msg, user) {
        if (
            Object.entries(user.inventory).some(([key, val]) => {
                return ((key in ForageItems) && val)
            })
        ) {
            return sendStandardMessage(client, msg, "You don't have the strength. You need to eat.");
        } else {
            this.killPlayer(user);
            return sendStandardMessage(client, msg, "You don't have the strength. You you feel so weak you don't think you can go on. And you don't. Goodbye.");
        }
    }

    killPlayer = async (user) => {
        delete this.bonfireCache.users[user.name];
        await Models.User.findOneAndDelete({ name: user.name });
        this.bonfireCache.getUser(user.name);
    }

    gather = async (client, msg, user, isForage = false) => {
        console.log('client? ', client)
        const remainingCapacity = user.capacity - user.getCurrentCarry();
        if (remainingCapacity <= 0) {
            return sendStandardMessage(client, msg, "You can't carry any more.");
        }       
        const loot = user.location.getGatherDrop((isForage ? 'forage' : 'gather'),  remainingCapacity);
        const hungerAmount = Hunger.gather;
        if (user.hunger + hungerAmount >= 100) {
            return sendStandardMessage(client, msg, this.checkStarved(client, msg, user));
        }
        user.hunger += hungerAmount;

        loot.forEach((lootItem) => {
            if (user.inventory.hasOwnProperty(lootItem.key)) {
                user.inventory[lootItem.key] += lootItem.amount;
            } else {
                user.inventory[lootItem.key] = lootItem.amount;
            }
        });

        await this.bonfireCache.updateUser(user);
        if (loot.length) {
            return client.createMessage(msg?.channel?.id, {
                embed: {
                    title: "Found something!", // Title of the embed
                    author: { // Author property
                        name: msg?.author?.username,
                        icon_url: msg?.author?.avatarURL
                    },
                    color: 0x008000, // Color, either in hex (show), or a base-10 integer
                    fields: loot.map((item) => ({
                        name: item.key,
                        value: item.amount
                    })),
                },
            });
        } else {
            return sendStandardMessage(client, msg, "You couldn't find anything useful.");
        }
    }

    displayStatus(client, msg, user) {
        console.log('inside display status with client: ', client)
        return client.createMessage(msg?.channel?.id, {
            embed: {
                title: "Status", // Title of the embed
                author: { // Author property
                    name: msg?.author?.username,
                    icon_url: msg?.author?.avatarURL
                },
                color: 0x008000, // Color, either in hex (show), or a base-10 integer
                fields: [ // Array of field objects
                    {
                        name: "Name", // Field title
                        value: user.name, // Field
                        inline: true // Whether you want multiple fields in same line
                    },
                    {
                        name: "Location",
                        value: user.location?.name ?? "Unknown",
                        inline: true,
                    },
                    {
                        name: `Health ${emojis.HEALTH}`,
                        value: user.health,
                        inline: true,
                    },
                    {
                        name: `Hunger ${emojis.HUNGER}`,
                        value: user.hunger,
                        inline: true,
                    },
                    {
                        name: `Inventory ${emojis.INVENTORY}`,
                        value: "test",
                        inline: false,
                    },
                    ...Object.entries(user.inventory).filter(([key, val]) => val).map(([key, val]) => ({
                        name: key,
                        value: val
                    })),
                ],
                // footer: { // Footer text
                //     text: "Created with Eris."
                // }
            }
        });
// nTotal Inventory: ${user.getCurrentCarry()}/${user.capacity}`;
    }

    move = async (client, msg, user, direction) => {
        console.log('direction? ', direction)
        if (!direction) {
            return `Must specify a destination.`;
        }
        let message;
        let icon;
        switch (direction && direction.toUpperCase()) {
            case 'FOREST':
            case 'F': {
                user.location = Locations.Forest;
                message = 'Location is now Forest.';
                icon = "evergreen_tree";
                break;
            }
            case 'MOUNTAIN':
            case 'MOUNTAINS':
            case 'M':
                user.location = Locations.Mountains;
                message = 'Location is now Mountains.';
                icon = "mountain_snow";
                break;
            case 'GRASSLANDS':
            case 'GRASSLAND':
            case 'G':
                user.location = Locations.Grasslands;
                message = 'Location is now Grasslands.';
                icon = "leafy_green";
                break;
            case 'BEACH':
            case 'B':
                user.location = Locations.Beach;
                message = 'Location is now Beach.';
                icon = "beach";
                break;
            default:
                message = "Destination not found.";
                return message;
        }

        const hungerAmount = Hunger.move;
        if (user.hunger + hungerAmount >= 100) {
            return this.checkStarved(client, msg, user);
        }
        user.hunger += hungerAmount;
        await this.bonfireCache.updateUser(user, message);

        return client.createMessage(msg?.channel?.id, {
            embed: {
                title: `Location is now :${icon}: ${user.location.name}`,
                author: { // Author property
                    name: msg?.author?.username,
                    icon_url: msg?.author?.avatarURL
                },
                color: 0x008000, // Color, either in hex (show), or a base-10 integer
            }
        });
    }
}

module.exports = Commands;