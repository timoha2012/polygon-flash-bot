import * as fs from 'fs';
import { tokens } from './tokens'; // Assuming this import provides a tokens object
//import { pools } from './pools';

// Provided data structure for a single pool
const pools = ['USDCe-WETH'];

const routerNames = ['Uniswap', 'Sushiswap', 'Quickswap'];

// Generate combinations
let combos = [];
for (let pool of pools) {
    let [tokenA, tokenB] = pool.split('-');

    for (let router1 of routerNames) {
        for (let router2 of routerNames) {
            // Ensure router1 and router2 are different
            if (router1 !== router2) {
                let combo = {
                    pool: pool,
                    tokenA: tokenA,
                    tokenB: tokenB,
                    router1: router1,
                    router2: router2
                };
                combos.push(combo);
            }
        }
    }
}

// Write to combos.json
fs.writeFile('combos.json', JSON.stringify(combos, null, 4), (err) => {
    if (err) {
        console.error('Error writing file:', err);
    } else {
        console.log('Combos file created successfully.');
    }
});
