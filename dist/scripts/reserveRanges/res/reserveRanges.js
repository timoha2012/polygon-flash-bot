"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const uniswapV2PairABI = [
    'function getReserves() external view returns (uint112, uint112, uint32)',
    'event Sync(uint112 reserve0, uint112 reserve1)'
];
const provider = new hardhat_1.ethers.JsonRpcProvider("https://polygon-mainnet.g.alchemy.com/v2/MGBhU6nCDGDQdIt8OrvzBxxfgQlt1BXs");
async function fetchCurrentReserves(poolAddress) {
    const poolContract = new hardhat_1.ethers.Contract(poolAddress, uniswapV2PairABI, provider);
    const reserves = await poolContract.getReserves();
    const resA = reserves[0];
    const resB = reserves[1];
    return { resA, resB };
}
function generateReserveRanges(reserve) {
    let reserveRanges = [];
    // Scale factors for dynamic range calculation
    const scaleFactorForBreakpoints = 0.2; // Example: 20% of the reserve
    const tradeSizeFactor = 0.1; // Example: Start with 0.1% trade size
    const maxSlippageFactor = 0.05; // Example: Start with 0.05% max slippage
    let currentBreakpoint = 0;
    let currentTradeSize = tradeSizeFactor;
    let currentMaxSlippage = maxSlippageFactor;
    while (currentBreakpoint < reserve) {
        let nextBreakpoint = currentBreakpoint + reserve * scaleFactorForBreakpoints;
        if (nextBreakpoint > reserve) {
            nextBreakpoint = reserve;
        }
        reserveRanges.push({
            range: `${currentBreakpoint}-${nextBreakpoint}`,
            tradeSizePercent: `${currentTradeSize}-${currentTradeSize + tradeSizeFactor}`,
            maxSlippage: `${currentMaxSlippage}`
        });
        // Update for next iteration
        currentBreakpoint = nextBreakpoint + 1;
        currentTradeSize += tradeSizeFactor; // Increment trade size percentage
        currentMaxSlippage += maxSlippageFactor; // Increment max slippage
        // Add logic to cap tradeSize and maxSlippage to reasonable maximums if needed
    }
    return reserveRanges;
}
async function main() {
    const poolAddress = "0xc4e595acDD7d12feC385E5dA5D43160e8A0bAC0E";
    const { resA, resB } = await fetchCurrentReserves(poolAddress);
    const resRangesA = {
        token: "MATIC",
        reserveRanges: generateReserveRanges(resA)
    };
    const resRangesB = {
        token: "WETH",
        reserveRanges: generateReserveRanges(resB)
    };
    console.log("tokenA Reserve Ranges:", resRangesA);
    console.log("tokenB Reserve Ranges:", resRangesB);
}
main();
