const Models = require('./db/models');
const User = require('./classes/user');
const MapTile = require('./classes/mapTiles/mapTile');
const Bonfire = require('./classes/bonfire');
const Defaults = require('../utils/defaults');
const { Base } = require('./classes/base');

class BonfireCache {
    constructor(db, client) {
        this.db = db;
        this.users = {};
        this.bonfire = null;
        this.map = null;
        this.mapTile = null;
        this.base = null;
        this.client = client;
    }

    createBonfire = async () => {
        if (!this.bonfire) {
            const bonfire = await Models.Bonfire.findOne().catch((err) =>
                console.warn(`Error loading bonfire: ${err}`)
            )
            if (bonfire) {
                this.bonfire = new Bonfire(bonfire)
            } else {
                const bonfireModel = new Models.Bonfire(Defaults.bonfire())
                await bonfireModel.save().catch((err) => {
                    throw newError(`Error saving bonfire: ${err}`)
                })
                this.bonfire = new Bonfire(bonfireModel)
            }
        }
        setTimeout(async () => {
            await this.removeWoodFromBonfireAndCheckBonfireStatus()
        }, (60000 * 5));

        if (!this.base) {
            const base = await Models.Base.findOne().catch((err) => {
                console.warn(`Error loading base: ${err}`);
            });
            if (base) {
                this.base = new Base(base.inventory);
            } else {
                const baseModel = new Models.Base();
                const newBase = await baseModel.save().catch((err) => {
                    throw newError(`Error saving base: ${err}`);
                });
                this.base = new Base();
            }
        }
    }

    removeWoodFromBonfireAndCheckBonfireStatus = async () => {
        await this.bonfire.removeFromBonfire(1)
        if (Date.now() > new Date(this.bonfire.rescueTime)) {
            // TODO: Check if user has won
            if (this.bonfire.fireLevel >= this.bonfire.neededForRescue) {
                console.log("The user won! With a firelevel of ", this.bonfire.fireLevel)
                console.log('and required: ', this.bonfire.neededForRescue)
                await this.client?.channel?.createMessage("You did it! Your fire was big enough and you were rescued! Nice.");
            } else {
                console.log('they missed rescue')
                await this.client?.channel?.createMessage("A ship passed by when you were gone but the fire wasn't big enough to be seen. Try again tomorrow");
            }
            await Models.Bonfire.deleteOne({});
            this.bonfire = null
            await this.createBonfire();
        }
        setTimeout(this.removeWoodFromBonfireAndCheckBonfireStatus, 60000)
    }

    async createUser(name, beachModel) {
        // TODO: creating a new user here, might want to add more default info
        const userModel = new Models.User(Defaults.user(name, beachModel))
        try {
            const newUser = await userModel.save()
            if (newUser) {
                return new User(newUser)
            }
        } catch (err) {
            throw new Error(`Error saving user: ${err}`)
        }
    }

    getUser = async (name) => {
        if (!this.users.hasOwnProperty(name)) {
            const user = await Models.User.findOne({ name }).catch((err) =>
                console.warn(`User FindOne failed: ${err}`)
            )
            if (user) {
                this.users[name] = new User(user)
            } else {
                let beachModel;
                try {
                    beachModel = await Models.MapTile.findOne({ name: 'Beach' })
                } catch (err) {
                    throw new Error(`Error retreiving beach tile: ${err}`)
                }

                if (!beachModel) {
                    beachModel = Models.MapTile(Defaults.mapTile('Beach'))
                    await beachModel.save()
                }
                this.users[name] = this.createUser(name, beachModel)
            }
        }
        return this.users[name];
    }

    updateBase = async (base) => {
        try {
            const baseDB = await Models.Base.findOne();
            baseDB.inventory = base.inventory;
            await baseDB.save();
            return "Base updated.";
        } catch (err) {
            console.warn(`Error finding and saving base for update: ${err}`)
            throw new Error();
        }
    }

    updateUser = async (newUser, message = 'Updated.') => {
        this.users[newUser.name] = newUser

        try {
            let user = await Models.User.findOne({ name: newUser.name })
            user.location = newUser.location
            user.inventory = newUser.inventory
            user.health = newUser.health
            user.hunger = newUser.hunger
            await user.save()
            return message
        } catch (err) {
            console.warn(`Error finding and saving user for update: ${err}`)
            throw new Error();
        }
    }
}

module.exports = BonfireCache
