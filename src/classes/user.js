const Locations = require("./mapTiles");

class User {
    constructor(userModel) {
        this.model = userModel;
        const { name, lastPrompt, location, inventory, capacity, hunger, health } = userModel;
        this.name = name;
        this.lastPrompt = lastPrompt;
        this.inventory = inventory;
        this.capacity = capacity;
        this.health = health;
        this.hunger = hunger;

        switch (location && location.name) {
            case "Beach":
                this.location = Locations.Beach;
                break;
            case "Forest":
                this.location = Locations.Forest;
                break;
            case "Mountains":
                this.location = Locations.Mountains;
                break;
            case "Grasslands":
                this.location = Locations.Grasslands;
                break;
            default:
                console.warn("Unable to find location: ", location);
                break;
        }
        console.log('made a user..this: ', this)
    }

    printName() {
        console.log(`Hello ${this.name}`);
    }
}

module.exports = User;