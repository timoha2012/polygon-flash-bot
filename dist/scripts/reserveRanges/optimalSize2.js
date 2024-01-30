"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const reserveGrid_json_1 = __importDefault(require("../../reserveGrid.json"));
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const resA = reserveGrid_json_1.default[0][0];
const resB = reserveGrid_json_1.default[0][1];
const resABn = new bignumber_js_1.default(resA);
const resBBn = new bignumber_js_1.default(resB);
//console.log(resABn.toFixed(),resBBn.toFixed());
async function calcSlippage(tradeSize) {
    const k = resABn.multipliedBy(resBBn);
    const bnInitPriceA = resBBn.dividedBy(tradeSize);
    const bnInitPriceB = resABn.dividedBy(resBBn);
    const newBnReserveA = resABn.plus(resBBn);
    const newBnReserveB = k.dividedBy(newBnReserveA);
    const bnNewPriceA = newBnReserveB.dividedBy(newBnReserveA);
    const bnNewPriceB = newBnReserveA.dividedBy(newBnReserveB);
    let slippagePerc = bnNewPriceB.minus(bnInitPriceB).dividedBy(bnInitPriceB).multipliedBy(100);
    return slippagePerc;
}
async function optTrade() {
}
