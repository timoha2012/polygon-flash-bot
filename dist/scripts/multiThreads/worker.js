"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const worker_threads_1 = require("worker_threads");
let Reserve0;
let Reserve1;
const provider = new ethers_1.ethers.JsonRpcProvider("https://polygon-mainnet.g.alchemy.com/v2/MGBhU6nCDGDQdIt8OrvzBxxfgQlt1BXs");
const pairContractABI = [
    'event Sync(uint112 reserve0, uint112 reserve1)',
    'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)'
];
function calcPrice(reserve0, reserve1) {
    const priceOfToken0 = Number(reserve1) / Number(reserve0);
    const priceOfToken1 = Number(reserve0) / Number(reserve1);
    return { priceOfToken0, priceOfToken1 };
}
function setupPoolListeners(poolData) {
    const { address, dex, token0, token1 } = poolData;
    const poolIdentifier = `${token0}-${token1}-${dex}`;
    const pairContract = new ethers_1.ethers.Contract(address, pairContractABI, provider);
    pairContract.on('Sync', (reserve0, reserve1) => {
        console.log(`Sync event detected on ${poolIdentifier}`);
        Reserve0 = reserve0;
        Reserve1 = reserve1;
        const prices = calcPrice(Reserve0, Reserve1);
        if (worker_threads_1.parentPort) {
            worker_threads_1.parentPort.postMessage({ prices, poolIdentifier });
        }
    });
    pairContract.on('Swap', (sender, amount0In, amount1In, amount0Out, amount1Out, to) => {
        console.log(`Swap event detected on ${poolIdentifier}`);
        Reserve0 = (Reserve0 + amount0In) - amount0Out;
        Reserve1 = (Reserve1 + amount1In) - amount1Out;
        const prices = calcPrice(Reserve0, Reserve1);
        if (worker_threads_1.parentPort) {
            worker_threads_1.parentPort.postMessage({ prices, poolIdentifier });
        }
    });
    console.log(`Listener set up for ${poolIdentifier} at address: ${address}`);
}
const pools = worker_threads_1.workerData.pools;
pools.forEach(setupPoolListeners);
if (!worker_threads_1.parentPort) {
    console.error('This script must be run as a worker thread.');
}
