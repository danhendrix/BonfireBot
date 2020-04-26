const m = require("mongoose");

const mapTile = new m.Schema({
    name: String,
});

const map = new m.Schema({
    size: Number,
    tiles: [mapTile],
});

const user = new m.Schema({
    name: String,
    health: Number,
    inventory: Object,
    location: mapTile,
    capacity: Number,
    hunger: Number,
});

const bonfire = new m.Schema({
    fireLevel: Number,
    neededForRescue: Number,
    rescueTime: Date,
});

bonfire.methods.addToBonfire = function(units) {
    this.fireLevel += units;
    this.save();
    return this.fireLevel;
};

bonfire.methods.removeFromBonfire = function(units) {
    this.fireLevel -= units;
    this.save();
    return this.fireLevel;
}

const User = m.model("User", user);
const MapTile = m.model('MapTile', mapTile);
const Map = m.model('Map', map);
const Bonfire = m.model('Bonfire', bonfire);

module.exports = {
    User,
    Bonfire,
    MapTile,
    Map,
};
