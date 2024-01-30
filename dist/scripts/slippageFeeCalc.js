"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.slippageFeeCalcV2 = void 0;
const ethers_1 = require("ethers");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const provider = new ethers_1.ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/55cea695d27f459b9bfc24c28083be5c");
const uniswapV2PairABI = [
    'function getReserves() external view returns (uint112, uint112, uint32)'
];
async function slippageFeeCalcV2(poolAddr, percentage) {
    const pairContract = new ethers_1.ethers.Contract(poolAddr, uniswapV2PairABI, provider);
    const reserves = await pairContract.getReserves();
    const reserveA = BigInt(reserves[0].toString());
    const reserveB = BigInt(reserves[1].toString());
    const bnReserveA = new bignumber_js_1.default(reserveA.toString());
    const bnReserveB = new bignumber_js_1.default(reserveB.toString());
    const bnTradeAmount = bnReserveA.multipliedBy(percentage).dividedBy(100);
    const k = bnReserveA.multipliedBy(bnReserveB);
    const bnInitPriceA = bnReserveB.dividedBy(bnReserveA);
    const bnInitPriceB = bnReserveA.dividedBy(bnReserveB);
    const newBnReserveA = bnReserveA.plus(bnTradeAmount);
    const newBnReserveB = k.dividedBy(newBnReserveA);
    const bnNewPriceA = newBnReserveB.dividedBy(newBnReserveA);
    const bnNewPriceB = newBnReserveA.dividedBy(newBnReserveB);
    let slippagePerc = bnNewPriceB.minus(bnInitPriceB).dividedBy(bnInitPriceB).multipliedBy(100);
    /*
    console.log("Reserve A: ", bnReserveA.toFixed(5));
    console.log("Trade size: ", bnTradeAmount.toFixed(5));
    console.log("Initial price B: ", bnInitPriceB.toString());
    console.log("New price B: ", bnNewPriceB.toString());
    console.log("difference: ", bnInitPriceB.minus(bnNewPriceB).toFixed(20));
    console.log("Slippage for Token B:", slippageB.toFixed(10) + "%");
    */
    const tradeSizeNumber = bnTradeAmount.toNumber();
    const slippagePercNumber = slippagePerc.toNumber();
    const initPriceBNumber = bnInitPriceB.toNumber();
    const finalPriceBNumber = bnNewPriceB.toNumber();
    return {
        tradeSize: tradeSizeNumber,
        slippagePerc: slippagePercNumber,
        initPriceB: initPriceBNumber,
        finalPriceB: finalPriceBNumber
    };
}
exports.slippageFeeCalcV2 = slippageFeeCalcV2;
/*
provider.getBlockNumber().then((blockNumber) => {
    console.log("Current block number:", blockNumber);
}).catch(console.error);
*/
