const { ForageItems, Items, MapTile } = require("./mapTile");

const dropObj = {
    [Items.wetWood]: {
        rate: .8,
        amount: [1,2],
    },
    // [Items.wetDeris]: {
    //     rate: 1,
    //     amount: [2,3],
    // },
    [Items.stone]: {
        rate: .7,
        amount: [1,2],
    },
}

const Beach = new MapTile("Beach", dropObj, {});

module.exports = Beach;