const bonfire = () => {
    const rescueTime = new Date();
    rescueTime.setMinutes(rescueTime.getMinutes() + Math.floor(Math.random() * 60 * 24));
    return {
        fireLevel: 0,
        neededForRescue: Math.floor(Math.random() * 10000),
        rescueTime,
    };
}

const mapTile = (name) => ({
    name,
});

const user = (name, locationModel) => ({
    name,
    health: 100,
    inventory: {
        Wood: 0,
    },
    location: locationModel,
    capacity: 100,
    hunger: 0,
});

const base = () => {
    return {
        inventory: {},
    };
};

module.exports = {
    bonfire,
    mapTile,
    user,
    base,
};