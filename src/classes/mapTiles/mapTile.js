const Items = {
    wetWood: 'Wet-Wood',
    wetDeris: 'Wet-Debris',
    stone: 'Stone',
    wood: 'Wood',
    sticks: 'Sticks',
    flint: 'Flint',
    leaves: 'Leaves',
    fiber: 'Fiber',
    coal: 'Coal',
    rope: 'Rope',
};

const ForageItems = {
    berries: 'Berries',
    honey: 'Honey',
    mushrooms: 'Mushrooms',
};

class MapTile {
    constructor(name, dropObj, forageObj) {
        this.name = name;
        this.dropObj = dropObj;
        this.forageObj = forageObj;
        console.log('forageObj? ', forageObj)
    }
    
    getGatherDrop = (type, maxLoad) => {
        console.log('max? ', maxLoad)
        const lookup = type === 'gather' ? this.dropObj : this.forageObj;
        let totalLoot = 0;
        return Object.entries(lookup).reduce((all, [key, val]) => {
            const dropRng = Math.random();
            const drop = dropRng <= val.rate;
            if (drop) {
                const numberRng = Math.random();
                const index = Math.floor((numberRng * val.amount.length));
                const currentAmount = val.amount[index];
                const amountKept = (currentAmount + totalLoot) > maxLoad
                    ? maxLoad - totalLoot
                    : currentAmount;
                
                all.push({
                    key,
                    amount: amountKept,
                });
                totalLoot += amountKept;
            }
            return all;
        }, []).filter((item) => item.amount);
    }
}

module.exports = {
    MapTile,
    Items,
    ForageItems,
};
