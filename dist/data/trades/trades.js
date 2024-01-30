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
const pools_1 = require("../pools"); // Assuming pools are imported from the pools.ts file
let trades = [];
for (const poolKey in pools_1.pools) {
    const pool = pools_1.pools[poolKey];
    const dexes = pool.dexes.map(dexInfo => dexInfo.name);
    // Create trades with original token order
    generateTrades(poolKey, pool.tokenA, pool.tokenB, dexes);
    // Create trades with swapped token order
    generateTrades(poolKey, pool.tokenB, pool.tokenA, dexes);
}
function generateTrades(poolKey, tokenA, tokenB, dexes) {
    for (let i = 0; i < dexes.length; i++) {
        for (let j = 0; j < dexes.length; j++) {
            // Ensure that the two routers are different
            if (i !== j) {
                let trade = {
                    pool: poolKey,
                    tokenA: tokenA,
                    tokenB: tokenB,
                    routers: [dexes[i], dexes[j]]
                };
                trades.push(trade);
            }
        }
    }
}
// Write to trades.json
fs.writeFile('trades.json', JSON.stringify(trades, null, 4), (err) => {
    if (err) {
        console.error('Error writing file:', err);
    }
    else {
        console.log('Trades file created successfully.');
    }
});
