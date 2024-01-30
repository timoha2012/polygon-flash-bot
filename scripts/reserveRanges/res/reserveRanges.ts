import { ethers, Contract } from 'ethers';
import BigNumber from "bignumber.js";

const uniswapV2PairABI = [
    'function getReserves() external view returns (uint112, uint112, uint32)',
    'event Sync(uint112 reserve0, uint112 reserve1)'
];

const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.g.alchemy.com/v2/MGBhU6nCDGDQdIt8OrvzBxxfgQlt1BXs");

type ReserveRange = {
    range: string;
    tradeSizePercent: string;
    maxSlippage: string;
};

type TokenReserveRanges = {
    token: string;
    reserveRanges: ReserveRange[];
};

async function fetchCurrentReserves(poolAddress: string): Promise<{ resA: number, resB: number }> {
    const poolContract = new ethers.Contract(poolAddress, uniswapV2PairABI, provider);
    const reserves = await poolContract.getReserves();
    const resA = reserves[0];
    const resB = reserves[1];
    return { resA, resB };
}

function generateReserveRanges(reserve: BigNumber): ReserveRange[] {
    let reserveRanges: ReserveRange[] = [];

    // Define a base scale factor for breakpoints (adjust as needed)
    const baseScaleFactor = new BigNumber(500000);

    // Initial trade size and slippage factors
    const tradeSizeFactor = 0.1;
    const maxSlippageFactor = 0.05;

    let currentBreakpoint = new BigNumber(0);
    let currentTradeSize = tradeSizeFactor;
    let currentMaxSlippage = maxSlippageFactor;

    while (currentBreakpoint.isLessThan(reserve)) {
        let nextBreakpoint = currentBreakpoint.plus(baseScaleFactor);
        if (nextBreakpoint.isGreaterThan(reserve)) {
            nextBreakpoint = reserve;
        }

        reserveRanges.push({
            range: `${currentBreakpoint.toFixed()}-${nextBreakpoint.toFixed()}`,
            tradeSizePercent: `${currentTradeSize}-${(currentTradeSize + tradeSizeFactor).toFixed(2)}`,
            maxSlippage: `${currentMaxSlippage.toFixed(2)}`
        });

        // Update for next iteration
        currentBreakpoint = nextBreakpoint.plus(1);
        currentTradeSize += tradeSizeFactor;
        currentMaxSlippage += maxSlippageFactor;

        // Consider adding logic to cap tradeSize and maxSlippage to reasonable maximums
    }

    return reserveRanges;
}


async function main() {
    const poolAddress = "0xc4e595acDD7d12feC385E5dA5D43160e8A0bAC0E";
    const { resA, resB } = await fetchCurrentReserves(poolAddress);
    const resABN = new BigNumber(resA);
    const resBBN = new BigNumber(resB);

    const resRangesA: TokenReserveRanges = {
        token: "MATIC",
        reserveRanges: generateReserveRanges(resABN)
    };

    const resRangesB: TokenReserveRanges = {
        token: "WETH",
        reserveRanges: generateReserveRanges(resBBN)
    };

    console.log("tokenA Reserve Ranges:", resRangesA);
    console.log("tokenB Reserve Ranges:", resRangesB);
}

main();
