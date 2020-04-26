const m = require("mongoose");

class Bonfire {
    constructor(bonfireModel) {
        this.model = bonfireModel;
        const { fireLevel, neededForRescue, rescueTime, rescueRange } = bonfireModel;
        this.fireLevel = fireLevel || 0;
        this.neededForRescue = neededForRescue || Math.floor(Math.random() * 10000);
        this.rescueTime = rescueTime || Math.floor(Math.random() * 60 * 24);
        this.rescueRange = rescueRange || Math.floor(Math.random() * 60);
    }

    addToBonfire = async (amount) => {
        this.fireLevel += amount;
        await this.model.addToBonfire(amount);
        return `Added to bonfire. Bonfire is now: ${this.fireLevel}`;
    }

    removeFromBonfire = async (amount) => {
        console.log('here with amount? ', amount)
        console.log('and fireleve? ', this.fireLevel);
        if (this.fireLevel > 0) {
            this.fireLevel -= amount;
            await this.model.removeFromBonfire(amount);
        }
    }
}

module.exports = Bonfire;