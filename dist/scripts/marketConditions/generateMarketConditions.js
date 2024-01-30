"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const trades2_json_1 = __importDefault(require("../../data/trades/trades2.json"));
const tokens_1 = require("../../data/tokens");
const resRanges_1 = require("./resRanges");
async function createJson() {
    for (let trade of trades2_json_1.default) {
        const tokenA = trade.tokens.name[0];
        const tokenB = trade.tokens.name[1];
        const tokenADec = tokens_1.tokens[tokenA].decimals;
        const tokenBDec = tokens_1.tokens[tokenB].decimals;
        const poolAddr = trade.dexs.pool[0];
        const step = 1;
        let tokenAIndex = 0;
        let tokenBIndex = 1;
        let _tokenAReserveRange, _tokenBReserveRange, _reserveAInt, _reserveBInt;
        if (trade.reverse == true) {
            tokenAIndex = 1;
            tokenBIndex = 0;
            const { tokenAReserveRange, tokenBReserveRange, reserveAInt, reserveBInt } = await (0, resRanges_1.calcResRanges)(poolAddr, tokenADec, tokenBDec, step, tokenAIndex, tokenBIndex);
            _tokenAReserveRange = tokenAReserveRange;
            _tokenBReserveRange = tokenBReserveRange;
            _reserveAInt = reserveAInt;
            _reserveBInt = reserveBInt;
        }
        else {
            const { tokenAReserveRange, tokenBReserveRange, reserveAInt, reserveBInt } = await (0, resRanges_1.calcResRanges)(poolAddr, tokenADec, tokenBDec, step, tokenAIndex, tokenBIndex);
            _tokenAReserveRange = tokenAReserveRange;
            _tokenBReserveRange = tokenBReserveRange;
            _reserveAInt = reserveAInt;
            _reserveBInt = reserveBInt;
        }
        console.log("-----------------------");
        console.log("pool: ", trade.pool);
        console.log(`current res ${tokenA}: ${_reserveAInt}`);
        console.log(`current res ${tokenB}: ${_reserveBInt}`);
        console.log(`${tokenA} res range: `, _tokenAReserveRange);
        console.log(`${tokenB} res range: `, _tokenBReserveRange);
        console.log("-----------------------");
    }
}
createJson();
