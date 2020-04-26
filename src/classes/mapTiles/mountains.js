const { Items, MapTile } = require("./mapTile");

const dropObj = {
    [Items.wood]: {
        rate: .5,
        amount: [1, 2],
    },
    [Items.stone]: {
        rate: 1,
        amount: [3, 4],
    },
    [Items.spring_water]: {
        rate: .2,
        amount: [10],
    },
    [Items.flint]: {
        rate: .05,
        amount: [2, 3],
    },
    [Items.coal]: {
        rate: .3,
        amount: [1, 2, 3],
    },
}

const Mountains = new MapTile("Mountains", dropObj);

module.exports = Mountains;