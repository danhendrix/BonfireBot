const Models = require("./db/models");
const { Hunger } = require("../utils");
const Locations = require("./classes/mapTiles");

const standardMenu = {
    G: 'Gather',
    M: 'Move - (F)orest (M)ountains (G)rasslands (B)each',
}

class Commands {
    constructor(bonfireCache) {
        this.bonfireCache = bonfireCache;
        this.commandList = {
            help: this.displayHelp,
            status: this.displayStatus,
            b: this.displayBonfire,
            g: this.gather,
            m: this.move,
            move: this.move,
        };
    }

    displayBonfire = async (user, command) => {
        console.log('command? ', command)
        if (user.location.name !== "Beach") {
            return "Not available from your location.";
        }
        if (!command) {
            return "Bonfire command required.";
        }
        let message;
        switch (command.charAt(0).toUpperCase()) {
            case "S":
                message = `Fire Level: ${this.bonfireCache.bonfire.fireLevel}\nRescue time: ${this.bonfireCache.bonfire.rescueTime}`;
                break;
            case "A": {
                console.log('command? ', command)
                const amount = +command.slice(1);
                console.log('amount? ', amount)
                if (isNaN(amount) || amount < 1) {
                    return "Must specify amount to add";
                }
                if (user.inventory.Wood < amount) {
                    return "You don't have enough wood.";
                }
                await this.bonfireCache.bonfire.addToBonfire(amount);
                user.inventory.Wood -= amount;
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
        const menu = standardMenu;
        if (user.location.name === 'Beach') {
            menu[0] = 'Bonfire - (S)tatus (A)dd(#)';
        }
        return Object.entries(menu).reduce((all, [key, val]) => {
            return `${all}\n${key} - ${val}`;
        }, ``);
    }

    gather = async (user) => {
        console.log('user.location? ', user.location)
        // TODO: This calculates if the user has enough room to gather wood based only on wood inventory.
        // should be expanded to look up all inventory for weight.
        const remainingCapacity = user.capacity - user.inventory.Wood;
        if (remainingCapacity === 0) {
            return "You can't carry any more.";
        }       
        const loot = user.location.getGatherDrop();
        console.log('loot? ', loot)
        const hungerAmount = Hunger.gather;
        if (user.hunger + hungerAmount >= 100) {
            return `You do not have the strength.`;
        }
        user.hunger += hungerAmount;

        loot.forEach((lootItem) => {
            if (user.inventory.hasOwnProperty(lootItem.key)) {
                user.inventory[lootItem.key] += lootItem.amount;
                console.log('had it, now: ', user.inventory[lootItem.key])
            } else {
                user.inventory[lootItem.key] = lootItem.amount;
                console.log('didnt, now full inventory: ', user.inventory)
            }
        });

        const message = `Gathering!...You gathered \n${loot.reduce((all, lootItem) => `${all}    ${lootItem.key}: ${lootItem.amount}\n`, "")}`;
        return await this.bonfireCache.updateUser(user, message);
    }

    displayStatus(user) {
        return `STATUS - Name: ${user.name}.\nLocation: ${user.location && user.location.name}\nHealth: ${user.health}\nHunger: ${user.hunger}\nInventory:\n${Object.entries(user.inventory).reduce((all, [key, val]) => { all += "    " + key + ": " + val + "\n"; return all;}, "")}\nTotal Inventory: ${Object.values(user.inventory).reduce((all, amount) => all + amount, 0)}/${user.capacity}`;
    }

    move = async (user, direction) => {
        console.log('direction? ', direction)
        if (!direction) {
            return `Must specify a destination.`;
        }
        let message;
        switch (direction && direction.toUpperCase()) {
            case 'F': {
                user.location = Locations.Forest;
                message = 'Location is now Forest.';
                break;
            }
            case 'M':
                user.location.name = Locations.Mountains;
                message = 'Location is now Mountains.';
                break;
            case 'G':
                user.location = Locations.Grasslands;
                message = 'Location is now Grasslands.';
                break;
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
            return "You do not have the strength.";
        }
        user.hunger += hungerAmount;
        return await this.bonfireCache.updateUser(user, message);
    }
}

module.exports = Commands;