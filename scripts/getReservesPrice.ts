import { ethers } from "ethers";
import trades from "../data/trades/trades2.json";
import { tokens } from "../data/tokens";

// Set up a provider to interact with the Ethereum blockchain
const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/55cea695d27f459b9bfc24c28083be5c");

// ABI for the Uniswap V2 Pair contract to access its getReserves function
const uniswapV2PairABI = [
    'function getReserves() external view returns (uint112, uint112, uint32)'
];

// Address of the Uniswap V2 liquidity pool contract
const pool = "0xf6B87181BF250af082272E3f448eC3238746Ce3D";

// Fetching the last trade details from the trades data
const lastTrade = trades[trades.length - 1];
// Getting decimals for each token involved in the trade
const decA = tokens[lastTrade.tokens.name[0]].decimals;
const decB = tokens[lastTrade.tokens.name[1]].decimals;

// Function to get reserve prices of tokens in the Uniswap V2 pool
export async function getResPrice(_pool: string, _decA: number, _decB: number) {
    // Creating a contract instance with the pool address, ABI, and provider
    const poolContract = new ethers.Contract(_pool, uniswapV2PairABI, provider);

    // Fetching reserves from the contract
    const reserves = await poolContract.getReserves();

    // Converting reserve amounts to BigInt for accurate arithmetic operations
    const reserveTokenA = BigInt(reserves[1].toString());
    const reserveTokenB = BigInt(reserves[0].toString());

    // Calculating the price of each token in the pair
    const priceTokenA = Number(reserveTokenB) / Number(reserveTokenA);
    const priceTokenB = Number(reserveTokenA) / Number(reserveTokenB);

    // Returning the reserves and prices of the tokens
    return { reserveTokenA, reserveTokenB, priceTokenA, priceTokenB };
}

// Executing the function with the pool and token decimals
getResPrice(pool, decA, decB);
