const { Items, MapTile } = require("./mapTile");

const dropObj = {
    [Items.wood]: {
        rate: 1,
        amount: [4, 5, 6, 7, 8, 9],
    },
    [Items.stone]: {
        rate: .4,
        amount: [1, 2],
    },
    [Items.sticks]: {
        rate: .7,
        amount: [2, 3],
    },
    [Items.flint]: {
        rate: .02,
        amount: [1, 2],
    },
    [Items.leaves]: {
        rate: .6,
        amount: [2, 3],
    },
    [Items.berries]: {
        rate: .3,
        amount: [2, 3, 4, 5],
    },
    [Items.mushrooms]: {
        rate: .2,
        amount: [2, 3],
    },
}

const Forest = new MapTile("Forest", dropObj);

module.exports = Forest;