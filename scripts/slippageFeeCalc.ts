import { ethers } from 'ethers';
import dotenv from 'dotenv/config';
import { dexs } from '../data/dexs';
import BigNumber from "bignumber.js";

const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/55cea695d27f459b9bfc24c28083be5c");

const uniswapV2PairABI = [
    'function getReserves() external view returns (uint112, uint112, uint32)'
];

export async function slippageFeeCalcV2(
    poolAddr: string,
    percentage: number
    ): Promise<{ tradeSize: number; slippagePerc: number; initPriceB: number; finalPriceB: number }> {
    const pairContract = new ethers.Contract(poolAddr, uniswapV2PairABI, provider);

    const reserves = await pairContract.getReserves();

    const reserveA: bigint = BigInt(reserves[0].toString());
    const reserveB: bigint = BigInt(reserves[1].toString());
    const bnReserveA = new BigNumber(reserveA.toString());
    const bnReserveB = new BigNumber(reserveB.toString());

    const bnTradeAmount = bnReserveA.multipliedBy(percentage).dividedBy(100);

    const k = bnReserveA.multipliedBy(bnReserveB);

    const bnInitPriceA = bnReserveB.dividedBy(bnReserveA);
    const bnInitPriceB = bnReserveA.dividedBy(bnReserveB);

    const newBnReserveA = bnReserveA.plus(bnTradeAmount);
    const newBnReserveB = k.dividedBy(newBnReserveA);

    const bnNewPriceA = newBnReserveB.dividedBy(newBnReserveA);
    const bnNewPriceB = newBnReserveA.dividedBy(newBnReserveB);

    let slippagePerc: any = bnNewPriceB.minus(bnInitPriceB).dividedBy(bnInitPriceB).multipliedBy(100);

    /*
    console.log("Reserve A: ", bnReserveA.toFixed(5));
    console.log("Trade size: ", bnTradeAmount.toFixed(5));
    console.log("Initial price B: ", bnInitPriceB.toString());
    console.log("New price B: ", bnNewPriceB.toString());
    console.log("difference: ", bnInitPriceB.minus(bnNewPriceB).toFixed(20));
    console.log("Slippage for Token B:", slippageB.toFixed(10) + "%");
    */

    const tradeSizeNumber = bnTradeAmount.toNumber();
    const slippagePercNumber = slippagePerc.toNumber();
    const initPriceBNumber = bnInitPriceB.toNumber();
    const finalPriceBNumber = bnNewPriceB.toNumber();

    return {
        tradeSize: tradeSizeNumber,
        slippagePerc: slippagePercNumber,
        initPriceB: initPriceBNumber,
        finalPriceB: finalPriceBNumber
    };
}

/*
provider.getBlockNumber().then((blockNumber) => {
    console.log("Current block number:", blockNumber);
}).catch(console.error);
*/
