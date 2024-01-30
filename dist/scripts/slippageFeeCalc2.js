"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const provider = new ethers_1.ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/55cea695d27f459b9bfc24c28083be5c");
const uniswapV2PairABI = [
    'function getReserves() external view returns (uint112, uint112, uint32)'
];
async function slippageFeeCalcV2(poolAddr, tradeAmount, tokenA, tokenB, decA, decB) {
    const pairContract = new ethers_1.ethers.Contract(poolAddr, uniswapV2PairABI, provider);
    const fee = 3000;
    const reserves = await pairContract.getReserves();
    const reserveA = BigInt(reserves[0].toString());
    const reserveB = BigInt(reserves[1].toString());
    const tradeAmountA = BigInt(ethers_1.ethers.parseUnits(tradeAmount.toString(), 18).toString());
    const k = reserveA * reserveB;
    const initPriceA = Number(reserveA) / Number(reserveB);
    const initPriceB = Number(reserveB) / Number(reserveA);
    //console.log("init price b: ",initPriceB);
    const newReserveA = reserveA + tradeAmountA;
    const newReserveB = k / newReserveA;
    const newPriceA = Number(newReserveA) / Number(newReserveB);
    const newPriceB = Number(newReserveB) / Number(newReserveA);
    const slippagePerc = ((Number(newPriceB) - initPriceB) / initPriceB) * (100);
    
    console.log(`Initial reserve of ${tokenA}: ${Number(ethers.formatUnits(reserveA,decA)).toFixed(0)}`);
    console.log(`Initial reserve of ${tokenB}: ${Number(ethers.formatUnits(reserveB,decB)).toFixed(0)}`);
    console.log(`Trade amount of ${tokenA}: ${Number(ethers.formatUnits(tradeAmountA,decA)).toFixed(0)}`);
    console.log(`Initial price of ${tokenA}: ${Number(initPriceA).toFixed(5)} relative to ${tokenB}`);
    console.log(`Initial price of ${tokenB}: ${Number(initPriceB).toFixed(5)} relative to ${tokenA}`);
    console.log(`New reserve of ${tokenA}: ${newReserveA}`);
    console.log(`New reserve of ${tokenB}: ${newReserveB}`);
    console.log(`New price of ${tokenA}: ${newPriceA} relative to ${tokenB}`);
    console.log(`New price of ${tokenB}: ${newPriceB} relative to ${tokenA}`);
    console.log(`Slippage % of ${tokenB}: ${Number(slippagePerc).toFixed(2)}%`);
    
    return slippagePerc;
}
const poolAddr = "0xc4e595acDD7d12feC385E5dA5D43160e8A0bAC0E";
const tradeAmount = 1000;
const tokenA = "MATIC";
const tokenB = "WETH";
const decA = 18;
const decB = 18;
slippageFeeCalcV2(poolAddr, tradeAmount, tokenA, tokenB, decA, decB).catch(console.error);
/*
provider.getBlockNumber().then((blockNumber) => {
    console.log("Current block number:", blockNumber);
}).catch(console.error);
*/ 
