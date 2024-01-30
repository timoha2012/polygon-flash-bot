import * as fs from 'fs';
import { pools } from '../pools';

// Define types for your tokens and dex information
type TokenInfo = {
    name: string,
    address: string
};

type DexInfo = {
    name: string,
    pool: string,
    router: string
};

type Trade2 = {
    pool: string;
    tokens: {
        name: string[],
        address: string[]
    };
    dexs: {
        name: string[],
        pool: string[],
        router: string[]
    };
    reverse: boolean; // Indicates if the trade tokens are in reversed order
};

let trades: Trade2[] = [];

for (const poolKey in pools) {
    const pool = pools[poolKey];
    generateTrades(pool, poolKey);
}

function generateTrades(pool: any, poolKey: any) {
    const tokenA: TokenInfo = pool.tokenA;
    const tokenB: TokenInfo = pool.tokenB;
    const dex: DexInfo[] = pool.dex;

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

function createTrade(tokenA: TokenInfo, tokenB: TokenInfo, dex1: DexInfo, dex2: DexInfo, poolKey: any, reverse: boolean): Trade2 {
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
    } else {
        console.log('Trades file created successfully.');
    }
});
