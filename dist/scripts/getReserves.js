"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const trades2_json_1 = __importDefault(require("../data/trades/trades2.json"));
const tokens_1 = require("../data/tokens");
const provider = new ethers_1.ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/55cea695d27f459b9bfc24c28083be5c");
const uniswapV2PairABI = [
    'function getReserves() external view returns (uint112, uint112, uint32)'
];
const pool = "0xf6B87181BF250af082272E3f448eC3238746Ce3D";
const lastTrade = trades2_json_1.default[trades2_json_1.default.length - 1];
const decA = tokens_1.tokens[lastTrade.tokens.name[0]].decimals;
const decB = tokens_1.tokens[lastTrade.tokens.name[1]].decimals;
async function getRes(pool) {
    const poolContract = new ethers_1.ethers.Contract(pool, uniswapV2PairABI, provider);
    const reserves = await poolContract.getReserves();
    const reserveTokenA = BigInt(reserves[1].toString());
    const reserveTokenB = BigInt(reserves[0].toString());
    console.log("Token A reserves: ", ethers_1.ethers.formatUnits(reserveTokenA, decA));
    console.log("Token B reserves: ", ethers_1.ethers.formatUnits(reserveTokenB, decB));
}
getRes(pool);
