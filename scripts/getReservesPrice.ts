import { ethers } from "ethers";
import trades from "../data/trades/trades2.json";
import { tokens } from "../data/tokens";

const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/55cea695d27f459b9bfc24c28083be5c");

const uniswapV2PairABI = [
    'function getReserves() external view returns (uint112, uint112, uint32)'
];

const pool = "0xf6B87181BF250af082272E3f448eC3238746Ce3D";

const lastTrade = trades[trades.length - 1];
const decA = tokens[lastTrade.tokens.name[0]].decimals;
const decB = tokens[lastTrade.tokens.name[1]].decimals;


export async function getResPrice(_pool: string, _decA: number, _decB: number) {
    const poolContract = new ethers.Contract(_pool, uniswapV2PairABI, provider);

    const reserves = await poolContract.getReserves();

    const reserveTokenA = BigInt(reserves[1].toString());
    const reserveTokenB = BigInt(reserves[0].toString());

    const priceTokenA = Number(reserveTokenB) / Number(reserveTokenA);
    const priceTokenB = Number(reserveTokenA) / Number(reserveTokenB);

    return { reserveTokenA, reserveTokenB, priceTokenA, priceTokenB };
}

getResPrice(pool, decA, decB);