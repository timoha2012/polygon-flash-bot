"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const slippageFeeCalc_1 = require("../slippageFeeCalc");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const uniswapV2PairABI = [
    'function getReserves() external view returns (uint112, uint112, uint32)'
];
const provider = new ethers_1.ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/55cea695d27f459b9bfc24c28083be5c");
function calculateProfit(tradeSize, slippagePerc, initPrice, finalPrice, feePercent) {
    const slippageAmount = tradeSize * (slippagePerc / 100);
    const adjustedTradeSize = tradeSize - slippageAmount;
    const revenue = adjustedTradeSize * finalPrice;
    const cost = tradeSize * initPrice;
    const fee = revenue * (feePercent / 100);
    const profit = revenue - cost - fee;
    const bnFee = new bignumber_js_1.default(fee);
    console.log("revenue: ", revenue);
    console.log("fee:", fee);
    return profit;
}
async function findOptimalTradeSizeForReserves(poolAddr, reserveA, reserveB, tokenA, tokenB, decA, decB) {
    let maxProfit = 0;
    let optimalTradeSize = 0;
    const feePercent = 0.6;
    const minTradeSize = 1;
    const maxTradeSize = 1000;
    const tradeSizeStep = 10;
    const percentage = 0.01;
    //for (let tradeSize = minTradeSize; tradeSize <= maxTradeSize; tradeSize += tradeSizeStep) {
    let { tradeSize, slippagePerc, initPriceB, finalPriceB } = await (0, slippageFeeCalc_1.slippageFeeCalcV2)(poolAddr, percentage);
    const bnTradeSize = new bignumber_js_1.default(tradeSize);
    let profit = calculateProfit(tradeSize, slippagePerc, initPriceB, finalPriceB, feePercent);
    const bnProfit = new bignumber_js_1.default(profit);
    if (profit > maxProfit) {
        maxProfit = profit;
        optimalTradeSize = tradeSize;
    }
    console.log("----------");
    console.log("Trade size: ", bnTradeSize.toFixed());
    console.log("Slippge Percentage: ", slippagePerc.toFixed(2) + "%");
    console.log("Price difference tokenB: ", finalPriceB - initPriceB);
    console.log("profit: ", bnProfit.toFixed(4));
    console.log("----------");
    //}
    return { optimalTradeSize, maxProfit };
}
const poolAddr = "0xc4e595acDD7d12feC385E5dA5D43160e8A0bAC0E";
const tokenA = "MATIC";
const tokenB = "WETH";
const decA = 18;
const decB = 18;
const reserveGrid = [
    [BigInt(Math.floor(2042789.0267361056)),
        BigInt(Math.floor(755.6818878653264))]
];
reserveGrid.forEach(async ([reserveA, reserveB]) => {
    const { optimalTradeSize, maxProfit } = await findOptimalTradeSizeForReserves(poolAddr, reserveA, reserveB, tokenA, tokenB, decA, decB);
    console.log(`Optimal trade size for reserves ${reserveA}, ${reserveB} is ${optimalTradeSize} with max profit ${maxProfit}`);
});
