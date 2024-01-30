"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertMaticToToken = void 0;
const hardhat_1 = require("hardhat");
const trades2_json_1 = __importDefault(require("../../data/trades/trades2.json"));
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const uniswapV2PairABI = [
    'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'
];
async function convertMaticToToken(tokenA, maticAmount, // Amount in MATIC
provider) {
    if (tokenA.toUpperCase() === "MATIC") {
        return maticAmount;
    }
    const tokenB = "MATIC";
    for (const trade of trades2_json_1.default) {
        if (trade.tokens.name.includes(tokenA) && trade.tokens.name.includes(tokenB)) {
            // Directly reference the pool address for the token pair
            const poolAddress = trade.dexs.pool[0]; // Assuming the first pool is the correct one
            const poolContract = new hardhat_1.ethers.Contract(poolAddress, uniswapV2PairABI, provider);
            try {
                const [reserve0, reserve1] = await poolContract.getReserves();
                let exchangeRate;
                if (trade.tokens.name[0] === tokenB) { // If MATIC is reserve0
                    exchangeRate = new bignumber_js_1.default(reserve1.toString()).div(new bignumber_js_1.default(reserve0.toString()));
                }
                else { // If MATIC is reserve1
                    exchangeRate = new bignumber_js_1.default(reserve0.toString()).div(new bignumber_js_1.default(reserve1.toString()));
                }
                const tokenAAmount = maticAmount.multipliedBy(exchangeRate);
                return tokenAAmount;
            }
            catch (error) {
                console.error('Error converting MATIC to Token:', error);
                return null;
            }
        }
    }
    //console.log("Pool not found for specified token pair.");
    return null;
}
exports.convertMaticToToken = convertMaticToToken;
const provider = new hardhat_1.ethers.JsonRpcProvider("https://polygon-mainnet.g.alchemy.com/v2/MGBhU6nCDGDQdIt8OrvzBxxfgQlt1BXs");
const tokenA = "WETH";
const tokenB = "MATIC";
const maticAmount = new bignumber_js_1.default(hardhat_1.ethers.parseUnits("1", "ether").toString()); // 1 MATIC
convertMaticToToken(tokenA, maticAmount, provider)
    .then(amount => {
    if (amount !== null) {
        //console.log(`Amount of ${tokenA} for 1 MATIC:`, amount.toString()); // Assuming Token A also uses 18 decimal places
    }
});
