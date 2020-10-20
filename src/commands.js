const Models = require("./db/models");
const { CraftMenu, Hunger, FlammableItems } = require("../utils");
const Locations = require("./classes/mapTiles");
const { ForageItems, Items } = require("./classes/mapTiles/mapTile");

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
            craft: this.craft,
            c: this.craft,
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
            stockpile: this.stockpile,
        };
    }

    base = () => {
        console.log('inventory? ', this.bonfireCache.base.inventory)
        return `Your base: ${Object.keys(this.bonfireCache.base.inventory)}`;
    }

    drop = async (user, item, amount) => {
        if (!item || (amount && typeof +amount !== "number")) {
            return "Must specify item and valid number. To drop all items of specified type leave amount blank.";
        }

        let formattedCommand = item.split('-').map((splitItem) => splitItem.charAt(0).toUpperCase() + splitItem.slice(1).toLowerCase()).join("-");
        if (!user.inventory.hasOwnProperty(formattedCommand)) {
            return "You don't have any of those.";
        }


        user.inventory[formattedCommand] -= Math.min((amount || user.inventory[formattedCommand]), user.inventory[formattedCommand]);
        this.bonfireCache.updateUser(user);
        return "Dropped.";
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

    eat = async (user, command, amountToEat) => {
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
                    return "Yum!"
                } else {
                    return this.findFoodToEat(user, amountOnHand, howHungry, amountOnHand, edibleItems);
                }
            }
            default: {
                return this.findFoodToEat(user, 10, howHungry, amountOnHand, edibleItems);
            }
        }
    }

    findFoodToEat(user, max, howHungry, amountOnHand, edibleItems) {
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

        return `Yum! Ate ${count} food`;
    }

    fire = async (user, command, type, amount) => {
        console.log('command? ', command)
        if (user.location.name !== "Beach") {
            return "Not available from your location.";
        }
        if (!command) {
            return "Bonfire command required.";
        }
        let message;
        switch (command.toUpperCase()) {
            case "MENU": {
                return `(Status) - Display status of bonfire.\n(Add #) - Add wood to the fire.`;
            }
            case "STATUS":
                return `Fire Level: ${this.bonfireCache.bonfire.fireLevel}\nRescue time: ${this.bonfireCache.bonfire.rescueTime}`;
            case "ADD": {
                if (amount && (isNaN(amount) || amount < 1)) {
                    return "Must specify valid amount to add";
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
                        return "You have nothing to add to the fire.";
                    }
                    flammableItemKeys.forEach((item) => {
                        user.inventory[item] = 0;
                    });
                    fireAddition = availableToBurn;
                } else {
                    if (!flammableItemKeys.includes(type)) {
                        return "That is not a flammable item.";
                    }
                    if (amount) {
                        if (user.inventory[type] < amount) {
                            return "You do not have that much";
                        
                        }
                        user.inventory[type] -= amount;
                        fireAddition = FlammableItems[type] * amount;
                    } else {
                        fireAddition = FlammableItems[type] * user.inventory[type];
                        user.inventory[type] = 0;
                    }
                }
    
                await this.bonfireCache.bonfire.addToBonfire(fireAddition);
                message = `Added to fire. Fire level now: ${this.bonfireCache.bonfire.fireLevel}`;
                await this.bonfireCache.updateUser(user, message)
                break;
            }
            default:
                message = "Unknown bonfire command.";
                break;
        }
        return message;
    }

    displayHelp(user) {
        const menu = JSON.parse(JSON.stringify(standardMenu));
        if (user.location.name === 'Beach') {
            menu['B'] = 'Bonfire - (S)tatus (A)dd(#)';
            menu['C'] = 'Craft - Type';
            menu["Base"] = 'Display Base';
        }
        return `Welcome to Bonfire!\n\nHere are the available commands:
            ${Object.entries(menu).reduce((all, [key, val]) => {
            return `${all}\n${key} - ${val}`;
        }, ``)}`;
    }

    craft = async (user, command, arg) => {
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

    forage = async (user) => {
        return this.gather(user, true);
    }

    checkStarved(user) {
        if (
            Object.entries(user.inventory).some(([key, val]) => {
                return ((key in ForageItems) && val)
            })
        ) {
            return "You don't have the strength. You need to eat.";
        } else {
            this.killPlayer(user);
            return "You don't have the strength. You you feel so weak you don't think you can go on. And you don't. Goodbye.";
        }
    }

    killPlayer = async (user) => {
        delete this.bonfireCache.users[user.name];
        await Models.User.findOneAndDelete({ name: user.name });
        this.bonfireCache.getUser(user.name);
    }

    gather = async (user, isForage = false) => {
        // TODO: This calculates if the user has enough room to gather wood based only on wood inventory.
        // should be expanded to look up all inventory for weight.
        const remainingCapacity = user.capacity - user.getCurrentCarry();
        if (remainingCapacity <= 0) {
            return "You can't carry any more.";
        }       
        const loot = user.location.getGatherDrop((isForage ? 'forage' : 'gather'),  remainingCapacity);
        const hungerAmount = Hunger.gather;
        if (user.hunger + hungerAmount >= 100) {
            return this.checkStarved(user);
        }
        user.hunger += hungerAmount;

        loot.forEach((lootItem) => {
            if (user.inventory.hasOwnProperty(lootItem.key)) {
                user.inventory[lootItem.key] += lootItem.amount;
            } else {
                user.inventory[lootItem.key] = lootItem.amount;
            }
        });

        const message = loot.length
            ? `Gathering!...You gathered \n${loot.reduce((all, lootItem) => `${all}    ${lootItem.key}: ${lootItem.amount}\n`, "")}`
            : "You couldn't find anything useful.";
        return await this.bonfireCache.updateUser(user, message);
    }

    displayStatus(user) {
        console.log('inside display status with user: ', user)
        return `STATUS - Name: ${user.name}.\nLocation: ${user.location && user.location.name}\nHealth: ${user.health}\nHunger: ${user.hunger}\nInventory:\n${Object.entries(user.inventory).filter(([key, val]) => val).reduce((all, [key, val]) => { all += "    " + key + ": " + val + "\n"; return all;}, "")}\nTotal Inventory: ${user.getCurrentCarry()}/${user.capacity}`;
    }

    move = async (user, direction) => {
        console.log('direction? ', direction)
        if (!direction) {
            return `Must specify a destination.`;
        }
        let message;
        switch (direction && direction.toUpperCase()) {
            case 'FOREST':
            case 'F': {
                user.location = Locations.Forest;
                message = 'Location is now Forest.';
                break;
            }
            case 'MOUNTAIN':
            case 'MOUNTAINS':
            case 'M':
                user.location = Locations.Mountains;
                message = 'Location is now Mountains.';
                break;
            case 'GRASSLANDS':
            case 'GRASSLAND':
            case 'G':
                user.location = Locations.Grasslands;
                message = 'Location is now Grasslands.';
                break;
            case 'BEACH':
            case 'B':
                user.location = Locations.Beach;
                message = 'Location is now Beach.';
                break;
            default:
                message = "Destination not found.";
                return message;
        }

        const hungerAmount = Hunger.move;
        if (user.hunger + hungerAmount >= 100) {
            return this.checkStarved(user);
        }
        user.hunger += hungerAmount;
        return await this.bonfireCache.updateUser(user, message);
    }
}

module.exports = Commands;