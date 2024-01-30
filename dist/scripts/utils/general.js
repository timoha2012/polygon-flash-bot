"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcOptimalTradeSize = exports.calcMinGap = exports.calcTradeSize = exports.calcNewRes = exports.getResPrice = exports.calcTotalCosts = exports.calcRevenue = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
function calcRevenue(priceBPool1, priceBPool2, tradeSizeTokenB) {
    const priceDifference = priceBPool2.minus(priceBPool1);
    const potentialRevenue = priceDifference.multipliedBy(tradeSizeTokenB);
    return potentialRevenue;
}
exports.calcRevenue = calcRevenue;
function calcTotalCosts(tradeSize, poolFeePercent, slippagePerc, gasCost) {
    const poolFeeCost = tradeSize * (poolFeePercent / 100);
    const slippageCost = tradeSize * (slippagePerc / 100);
    const totalTradeCost = poolFeeCost + slippageCost + gasCost;
    return totalTradeCost;
}
exports.calcTotalCosts = calcTotalCosts;
async function getResPrice(_contract, _decA, _decB) {
    const reserves = await _contract.getReserves();
    const reserveTokenA = BigInt(reserves[0].toString());
    const reserveTokenB = BigInt(reserves[1].toString());
    const bnReserveA = new bignumber_js_1.default(reserveTokenA.toString());
    const bnReserveB = new bignumber_js_1.default(reserveTokenB.toString());
    const bnPriceA = bnReserveB.dividedBy(bnReserveA);
    const bnPriceB = bnReserveA.dividedBy(bnReserveB);
    return { bnReserveA, bnReserveB, bnPriceA, bnPriceB };
}
exports.getResPrice = getResPrice;
function calcNewRes(resA, resB, tradeSize) {
    const bnTradeSize = new bignumber_js_1.default(tradeSize);
    const k = resA.times(resB);
    const newReserveA = resA.plus(bnTradeSize);
    const newReserveB = k.dividedBy(newReserveA);
    const newPriceA = newReserveB.dividedBy(newReserveA);
    const newPriceB = newReserveA.dividedBy(newReserveB);
    return { newReserveA, newReserveB, newPriceA, newPriceB };
}
exports.calcNewRes = calcNewRes;
function calcTradeSize(reserveAmount, percentage) {
    const decimalPercentage = percentage / 100;
    const tradeSize = reserveAmount * decimalPercentage;
    return tradeSize;
}
exports.calcTradeSize = calcTradeSize;
function calcMinGap(totalCostsWETH, tradeSizeTokenB, refPrice) {
    if (tradeSizeTokenB.isEqualTo(0)) {
        throw new Error("Trade size of Token B cannot be zero.");
    }
    const minGap = totalCostsWETH.dividedBy(tradeSizeTokenB);
    let minGapPerc = minGap.dividedBy(refPrice).multipliedBy(100);
    minGapPerc = minGapPerc.toNumber();
    return { minGap, minGapPerc };
}
exports.calcMinGap = calcMinGap;
function calcOptimalTradeSize(expSlippage, // pre calculated from res grid
gapPerc, gasCostTokenA, pool1ResB, riskTolerance, maxTradeSize, minProfitMargin) {
    let tradeSize1 = pool1ResB.multipliedBy(gapPerc / 100).multipliedBy(riskTolerance / 100);
    tradeSize1 = bignumber_js_1.default.min(tradeSize1, maxTradeSize);
    const totalTradeCost = gasCostTokenA.plus(tradeSize1.multipliedBy(0.006));
    let tradeSize2 = tradeSize1.minus(totalTradeCost);
    const expectedSlippage = tradeSize2.multipliedBy(expSlippage); // Slippage 1%
    tradeSize2 = tradeSize2.minus(expectedSlippage);
    let tradeSize3 = tradeSize2.multipliedBy(1 - minProfitMargin / 100);
    tradeSize3 = bignumber_js_1.default.max(tradeSize3, new bignumber_js_1.default(0));
    tradeSize3 = bignumber_js_1.default.min(tradeSize3, maxTradeSize);
    return tradeSize3;
}
exports.calcOptimalTradeSize = calcOptimalTradeSize;
