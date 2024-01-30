import { ethers } from 'ethers';
import fs from 'fs';
import trades from "../../data/trades/trades2.json";
import { tokens } from '../../data/tokens';
import { calcResRanges } from './resRanges';

async function createJsonFilesForPools() {
    for (let trade of trades) {
        const poolAddr = trade.dexs.pool[0];
        const tokenA = tokens[trade.tokens.name[0]];
        const tokenB = tokens[trade.tokens.name[1]];

        const { tokenAReserveRange, tokenBReserveRange } = await calcResRanges(poolAddr, tokenA.decimals, tokenB.decimals, 1, 0, 1);
        let dataPoints = [];

        // Iterate over tokenA range
        for (let i = tokenAReserveRange.min; i <= tokenAReserveRange.max; i += tokenAReserveRange.step) {
            // For each tokenA reserve point, iterate over entire tokenB range
            for (let j = tokenBReserveRange.min; j <= tokenBReserveRange.max; j += tokenBReserveRange.step) {
                dataPoints.push({
                    reserveA: i,
                    reserveB: j
                });
            }
        }

        // Write the reserve points to a JSON file named after the pool
        const filename = `./data/${trade.pool}.json`;
        fs.writeFile(filename, JSON.stringify(dataPoints, null, 4), (err) => {
            if (err) {
                console.error(`Error writing file for pool ${trade.pool}:`, err);
            } else {
                console.log(`File created successfully for pool ${trade.pool}.`);
            }
        });
    }
}

createJsonFilesForPools().catch(console.error);
