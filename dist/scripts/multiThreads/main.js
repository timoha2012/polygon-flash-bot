"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const path_1 = __importDefault(require("path"));
const pools2_1 = require("../../data/pools2");
const latestPrices = {};
for (const poolIdentifier in pools2_1.pools2) {
    latestPrices[poolIdentifier] = { token0Price: null, token1Price: null };
}
function calculatePercentageDifference(value1, value2) {
    return ((value1 - value2) / ((value1 + value2) / 2)) * 100;
}
const poolGroups = {};
Object.values(pools2_1.pools2).forEach(pool => {
    const tokenPair = `${pool.token0}-${pool.token1}`;
    if (!poolGroups[tokenPair]) {
        poolGroups[tokenPair] = [];
    }
    poolGroups[tokenPair].push(pool);
});
function comparePricesWithinGroup(tokenPair, pools) {
    pools.forEach((pool1, index) => {
        for (let j = index + 1; j < pools.length; j++) {
            const pool2 = pools[j];
            if (pool1.dex !== pool2.dex) {
                const pool1Prices = latestPrices[`${pool1.token0}-${pool1.token1}-${pool1.dex}`];
                const pool2Prices = latestPrices[`${pool2.token0}-${pool2.token1}-${pool2.dex}`];
                if (pool1Prices && pool2Prices && pool1Prices.token0Price && pool2Prices.token0Price) {
                    const priceDiff = calculatePercentageDifference(pool1Prices.token0Price, pool2Prices.token0Price);
                    console.log(`Percentage difference in ${tokenPair} price between ${pool1.dex} and ${pool2.dex}: ${priceDiff.toFixed(2)}%`);
                }
            }
        }
    });
}
function comparePrices() {
    Object.keys(poolGroups).forEach(tokenPair => {
        comparePricesWithinGroup(tokenPair, poolGroups[tokenPair]);
    });
}
function startWorker() {
    const workerData = { pools: Object.values(pools2_1.pools2) };
    const worker = new worker_threads_1.Worker(path_1.default.join(__dirname, 'worker.js'), {
        workerData: workerData
    });
    worker.on('message', (msg) => {
        const { prices, poolIdentifier } = msg;
        if (latestPrices[poolIdentifier]) {
            latestPrices[poolIdentifier] = {
                token0Price: prices.priceOfToken0,
                token1Price: prices.priceOfToken1
            };
        }
        else {
            console.warn(`Received price update for unknown pool: ${poolIdentifier}`);
        }
        comparePrices();
    });
    worker.on('error', (err) => {
        console.error('Worker error:', err);
    });
    worker.on('exit', (code) => {
        if (code !== 0) {
            console.error(`Worker stopped with exit code ${code}`);
        }
    });
}
startWorker();
