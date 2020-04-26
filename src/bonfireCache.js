const Models = require("./db/models");
const User = require("./classes/user");
const MapTile = require("./classes/mapTiles/mapTile");
const Bonfire = require("./classes/bonfire");
const Defaults = require("../utils/defaults");



class BonfireCache {
    constructor(db) {
        this.db = db;
        this.users = {};
        this.bonfire = null;
        this.map = null;
        this.mapTile = null;
    }

    createBonfire = async () => {
        console.log('create bonfire was ran with : ', this.bonfire)
        if (!this.bonfire) {
            console.log('got here')
            const bonfire = await Models.Bonfire.findOne().catch((err) => console.warn(`Error loading bonfire: ${err}`));
            if (bonfire) {
                this.bonfire = new Bonfire(bonfire);
                console.log('bonfire now: ', this.bonfire)
            } else {
                console.log('creating')
                const bonfireModel = new Models.Bonfire(Defaults.bonfire());
                console.log('bonfireModel?', bonfireModel)
                await bonfireModel.save().catch((err) => { throw newError(`Error saving bonfire: ${err}`)});
                this.bonfire = new Bonfire(bonfireModel);
                console.log('bonfire? ', this.bonfire)
            }
        }
        setTimeout(async () => {
            await this.removeWoodFromBonfireAndCheckBonfireStatus();
        }, 60000);
    }

    removeWoodFromBonfireAndCheckBonfireStatus = (async () => {
        await this.bonfire.removeFromBonfire(1);
        if (Date.now() > new Date(this.bonfire.rescueTime)) {
            console.log('in here')
            await Models.Bonfire.deleteOne({});
            this.bonfire = null;
            await this.createBonfire();
        }
        setTimeout(this.removeWoodFromBonfireAndCheckBonfireStatus, 60000);
    });

    async createUser(name, beachModel) {
        // TODO: creating a new user here, might want to add more default info
        const userModel = new Models.User(Defaults.user(name, beachModel));
        try {
            const newUser = await userModel.save();
            if (newUser) {
                return new User(newUser);
            }
        } catch (err) {
            throw new Error(`Error saving user: ${err}`);
        }
    }

    getUser = async (name) => {
        console.log('this.user: ', this.users[name])
        if (!this.users.hasOwnProperty(name)) {
            const user = await Models.User.findOne({ name }).catch((err) => console.warn(`User FindOne failed: ${err}`));
            if (user) {
                console.log('here with user? ', user)
                this.users[name] = new User(user);
            } else {
                let beachModel;
                try {
                    beachModel = await Models.MapTile.findOne({ name: "Beach" });
                } catch (err) {
                    throw new Error(`Error retreiving beach tile: ${err}`);
                }
                
                if (!beachModel) {
                    beachModel = Models.MapTile(Defaults.mapTile("Beach"));
                    await beachModel.save();
                }
                this.users[name] = this.createUser(name, beachModel);
            }
        }
        console.log('leaving get with user: ', this.users[name])
        return this.users[name];
    }

    updateUser = async (newUser, message = "Updated.") => {
        this.users[newUser.name] = newUser;

        try {
            let user = await Models.User.findOne({ name: newUser.name });
            user.location = newUser.location;
            user.inventory = newUser.inventory;
            user.health = newUser.health;
            user.hunger = newUser.hunger;
            await user.save();
            return message;
        } catch (err) {
            console.warn(`Error finding and saving user for update: ${err}`);
            throw new Error();
        }
    }
}

module.exports = BonfireCache;