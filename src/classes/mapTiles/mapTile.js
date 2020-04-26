const Items = {
    wetWood: 'Wet Wood',
    wetDeris: 'Wet Debris',
    stone: 'Stone',
    wood: 'Wood',
    sticks: 'Sticks',
    flint: 'Flint',
    leaves: 'Leaves',
    berries: 'Berries',
    fiber: 'Fiber',
    honey: 'Honey',
    mushrooms: 'Mushrooms',
    spring_water: 'Spring Water',
    coal: 'Coal',
};


class MapTile {
    constructor(name, dropObj) {
        this.name = name;
        this.dropObj = dropObj;
    }
    
    getGatherDrop = () => {
        return Object.entries(this.dropObj).reduce((all, [key, val]) => {
            const dropRng = Math.random();
            const drop = dropRng <= val.rate;
            if (drop) {
                const numberRng = Math.random();
                const index = Math.floor((numberRng * val.amount.length));
                
                all.push({
                    key,
                    amount: val.amount[index],
                });
            }
            return all;
        }, []);
    }
}

module.exports = {
    MapTile,
    Items,
};
