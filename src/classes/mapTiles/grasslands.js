const { ForageItems, Items, MapTile } = require("./mapTile");

const dropObj = {
    [Items.wood]: {
        rate: .5,
        amount: [2, 3],
    },
    [Items.stone]: {
        rate: .6,
        amount: [2, 3],
    },
    [Items.sticks]: {
        rate: 1,
        amount: [3, 4],
    },
    [Items.leaves]: {
        rate: .7,
        amount: [3, 4],
    },
    [Items.flint]: {
        rate: .01,
        amount: [1],
    },
    [Items.fiber]: {
        rate: .4,
        amount: [1, 2],
    },
}

const forageObj = {
    [ForageItems.berries]: {
        rate: .7,
        amount: [3, 4, 5, 6],
    },
    [ForageItems.honey]: {
        rate: .1,
        amount: [1],
    },
};

const Grasslands = new MapTile("Grasslands", dropObj, forageObj);

module.exports = Grasslands;