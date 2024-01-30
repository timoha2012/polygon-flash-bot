"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const trades2_json_1 = __importDefault(require("../../data/trades/trades2.json"));
const tokens_1 = require("../../data/tokens");
const resRanges_1 = require("./resRanges");
async function createJsonFilesForPools() {
    for (let trade of trades2_json_1.default) {
        const poolAddr = trade.dexs.pool[0];
        const tokenA = tokens_1.tokens[trade.tokens.name[0]];
        const tokenB = tokens_1.tokens[trade.tokens.name[1]];
        const { tokenAReserveRange, tokenBReserveRange } = await (0, resRanges_1.calcResRanges)(poolAddr, tokenA.decimals, tokenB.decimals, 1, 0, 1);
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
        fs_1.default.writeFile(filename, JSON.stringify(dataPoints, null, 4), (err) => {
            if (err) {
                console.error(`Error writing file for pool ${trade.pool}:`, err);
            }
            else {
                console.log(`File created successfully for pool ${trade.pool}.`);
            }
        });
    }
}
createJsonFilesForPools().catch(console.error);
