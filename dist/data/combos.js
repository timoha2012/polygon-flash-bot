"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
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
    }
    else {
        console.log('Combos file created successfully.');
    }
});
