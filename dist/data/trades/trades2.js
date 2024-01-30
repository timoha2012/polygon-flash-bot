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
const pools_1 = require("../pools");
let trades = [];
for (const poolKey in pools_1.pools) {
    const pool = pools_1.pools[poolKey];
    generateTrades(pool, poolKey);
}
function generateTrades(pool, poolKey) {
    const tokenA = pool.tokenA;
    const tokenB = pool.tokenB;
    const dex = pool.dex;
    for (let i = 0; i < dex.length; i++) {
        for (let j = 0; j < dex.length; j++) {
            if (i !== j) {
                // Trade 1: Token A → Token B with Dex i → Dex j
                trades.push(createTrade(tokenA, tokenB, dex[i], dex[j], poolKey, false));
                // Trade 2: Token B → Token A with Dex i → Dex j
                trades.push(createTrade(tokenB, tokenA, dex[i], dex[j], poolKey, true));
            }
        }
    }
}
function createTrade(tokenA, tokenB, dex1, dex2, poolKey, reverse) {
    return {
        pool: poolKey,
        tokens: {
            name: [tokenA.name, tokenB.name],
            address: [tokenA.address, tokenB.address]
        },
        dexs: {
            name: [dex1.name, dex2.name],
            pool: [dex1.pool, dex2.pool],
            router: [dex1.router, dex2.router]
        },
        reverse: reverse
    };
}
// Write to trades2.json
fs.writeFile('trades2.json', JSON.stringify(trades, null, 4), (err) => {
    if (err) {
        console.error('Error writing file:', err);
    }
    else {
        console.log('Trades file created successfully.');
    }
});
