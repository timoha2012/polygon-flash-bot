import { ethers } from 'ethers';
import dotenv from 'dotenv/config'; // Import dotenv for environment variable management
import { dexs } from '../data/dexs';
import BigNumber from "bignumber.js"; // BigNumber library for precise arithmetic

// Configure the Ethereum provider
const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/55cea695d27f459b9bfc24c28083be5c");

// Uniswap V2 Pair ABI for accessing the getReserves function
const uniswapV2PairABI = [
    'function getReserves() external view returns (uint112, uint112, uint32)'
];

// Function to calculate the slippage fee for a given percentage trade size in a Uniswap V2 pool
export async function slippageFeeCalcV2(
    poolAddr: string,
    percentage: number
    ): Promise<{ tradeSize: number; slippagePerc: number; initPriceB: number; finalPriceB: number }> {
    
    // Creating a contract instance for the specified pool
    const pairContract = new ethers.Contract(poolAddr, uniswapV2PairABI, provider);

    // Fetching current reserves from the pool
    const reserves = await pairContract.getReserves();
    
    // Converting reserve values to BigInt for precision
    const reserveA: bigint = BigInt(reserves[0].toString());
    const reserveB: bigint = BigInt(reserves[1].toString());
    // Using BigNumber for precise arithmetic operations
    const bnReserveA = new BigNumber(reserveA.toString());
    const bnReserveB = new BigNumber(reserveB.toString());

    // Calculating the trade amount based on percentage
    const bnTradeAmount = bnReserveA.multipliedBy(percentage).dividedBy(100);

    // Using the constant product formula (k = x * y) to maintain pool's liquidity
    const k = bnReserveA.multipliedBy(bnReserveB);

    // Calculating initial prices for the tokens
    const bnInitPriceA = bnReserveB.dividedBy(bnReserveA);
    const bnInitPriceB = bnReserveA.dividedBy(bnReserveB);

    // Calculating new reserves after the trade
    const newBnReserveA = bnReserveA.plus(bnTradeAmount);
    const newBnReserveB = k.dividedBy(newBnReserveA);

    // Calculating new prices after the trade
    const bnNewPriceA = newBnReserveB.dividedBy(newBnReserveA);
    const bnNewPriceB = newBnReserveA.dividedBy(newBnReserveB);

    // Calculating slippage percentage
    let slippagePerc: any = bnNewPriceB.minus(bnInitPriceB).dividedBy(bnInitPriceB).multipliedBy(100);

    // Converting results to JavaScript numbers for easier handling
    const tradeSizeNumber = bnTradeAmount.toNumber();
    const slippagePercNumber = slippagePerc.toNumber();
    const initPriceBNumber = bnInitPriceB.toNumber();
    const finalPriceBNumber = bnNewPriceB.toNumber();

    // Returning the calculated values
    return {
        tradeSize: tradeSizeNumber,
        slippagePerc: slippagePercNumber,
        initPriceB: initPriceBNumber,
        finalPriceB: finalPriceBNumber
    };
}

// Uncomment to get the current block number from the provider, useful for debugging or other operations
/*
provider.getBlockNumber().then((blockNumber) => {
    console.log("Current block number:", blockNumber);
}).catch(console.error);
*/
