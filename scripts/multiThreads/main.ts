import { Worker } from 'worker_threads';
import path from 'path';
import { pools2 } from '../../data/pools2';

interface PoolData {
    token0: string;
    token1: string;
    address: string;
    dex: string;
}

interface WorkerData {
    pools: PoolData[];
}

interface PriceData {
    token0Price: number | null;
    token1Price: number | null;
}

interface LatestPrices {
    [key: string]: PriceData;
}

const latestPrices: LatestPrices = {};

for (const poolIdentifier in pools2) {
    latestPrices[poolIdentifier] = { token0Price: null, token1Price: null };
}

function calculatePercentageDifference(value1: number, value2: number): number {
    return ((value1 - value2) / ((value1 + value2) / 2)) * 100;
}

interface PoolGroup {
    [tokenPair: string]: typeof pools2[keyof typeof pools2][];
}

const poolGroups: PoolGroup = {};

Object.values(pools2).forEach(pool => {
    const tokenPair = `${pool.token0}-${pool.token1}`;
    if (!poolGroups[tokenPair]) {
        poolGroups[tokenPair] = [];
    }
    poolGroups[tokenPair].push(pool);
});

function comparePricesWithinGroup(tokenPair: string, pools: typeof pools2[keyof typeof pools2][]) {
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
    const workerData: WorkerData = { pools: Object.values(pools2) };

    const worker = new Worker(path.join(__dirname, 'worker.js'), {
        workerData: workerData
    });

    worker.on('message', (msg) => {
        const { prices, poolIdentifier } = msg;
    
        if (latestPrices[poolIdentifier]) {
            latestPrices[poolIdentifier] = {
                token0Price: prices.priceOfToken0,
                token1Price: prices.priceOfToken1
            };
        } else {
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
