import { ethers } from 'ethers';
import dotenv from 'dotenv/config';
import trades from '../data/trades/trades2.json'; // Path to your trades2.json file

//const provider = new ethers.JsonRpcProvider(process.env.PROVIDER);
const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/55cea695d27f459b9bfc24c28083be5c");

const uniswapV2PairABI = [
    'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function token0() external view returns (address)',
    'function token1() external view returns (address)'
];

async function comparePrices() {
    for (const trade of trades) {
        const poolAContract = new ethers.Contract(trade.dexs.pool[0], uniswapV2PairABI, provider);
        const poolBContract = new ethers.Contract(trade.dexs.pool[1], uniswapV2PairABI, provider);

        const [reservesA, reservesB] = await Promise.all([
            poolAContract.getReserves(),
            poolBContract.getReserves()
        ]);

        // Assuming tokenA is always the first token in the pair
        const priceAInPoolA = Number(reservesA.reserve0) / Number(reservesA.reserve1);
        const priceAInPoolB = Number(reservesB.reserve0) / Number(reservesB.reserve1);

        console.log(`Trade between ${trade.tokens.name[0]} and ${trade.tokens.name[1]}`);
        console.log(`Price of ${trade.tokens.name[0]} in Pool A: ${priceAInPoolA}`);
        console.log(`Price of ${trade.tokens.name[0]} in Pool B: ${priceAInPoolB}`);

        /*
        if (Math.abs(priceAInPoolA - priceAInPoolB) > SOME_THRESHOLD) {
            console.log(`Potential arbitrage opportunity found!`);
        }
        */
    }
}

const SOME_THRESHOLD = 0.01; // Define your threshold for price differences
comparePrices().catch(console.error);
