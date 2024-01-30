import { ethers } from 'ethers';
import { pools } from '../../data/pools';

const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/55cea695d27f459b9bfc24c28083be5c");

const uniswapV2PairABI = [
    'function getReserves() external view returns (uint112, uint112, uint32)'
];

export async function calcResRanges(
    poolAddr: string, 
    _tokenADec: number,
    _tokenBDec: number,
    _step: number,
    _tokenAIndex: number,
    _tokenBIndex: number
) {
    const poolContract = new ethers.Contract(poolAddr, uniswapV2PairABI, provider);

    const reserves = await poolContract.getReserves();

    const reserveTokenA = BigInt(reserves[_tokenAIndex].toString());
    const reserveTokenB = BigInt(reserves[_tokenBIndex].toString());

    const reserveAInt = Number(ethers.formatUnits(reserveTokenA, _tokenADec));
    const reserveBInt = Number(ethers.formatUnits(reserveTokenB, _tokenBDec));

    function calculateDynamicRange(reserveInt: number, tokenDecimals: number): { min: number; max: number; step: number } {
        // Convert reserve to its smallest unit based on decimals
        const reserveInSmallestUnit = reserveInt * Math.pow(10, tokenDecimals);

        // Calculate range in the smallest unit
        const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(reserveInSmallestUnit, 1))));
        const min = Math.max(reserveInSmallestUnit - magnitude, 0);
        const max = reserveInSmallestUnit + magnitude;

        // Convert back to token unit
        const minInTokenUnit = min / Math.pow(10, tokenDecimals);
        const maxInTokenUnit = max / Math.pow(10, tokenDecimals);

        // Set a proportional step size
        const step = Math.max(Math.floor(magnitude / 100) / Math.pow(10, tokenDecimals), 1 / Math.pow(10, tokenDecimals));

        return { min: minInTokenUnit, max: maxInTokenUnit, step: step };
    }

    const tokenAReserveRange = calculateDynamicRange(reserveAInt, _tokenADec);
    const tokenBReserveRange = calculateDynamicRange(reserveBInt, _tokenBDec);

    return { tokenAReserveRange, tokenBReserveRange, reserveAInt, reserveBInt };
}

// Example usage of the function
async function main() {
    const poolName = "MATIC-WETH";
    const poolAddress = pools[poolName].dex[0].pool;
    const tokenADecimals = pools[poolName].tokenA.decimals;
    const tokenBDecimals = pools[poolName].tokenB.decimals;
    const step = 1;
    const tokenAIndex = 0; // Index of Token A in the reserves array
    const tokenBIndex = 1; // Index of Token B in the reserves array
    
    const ranges = await calcResRanges(poolAddress, tokenADecimals, tokenBDecimals, step, tokenAIndex, tokenBIndex);
    console.log("Reserve Ranges for pool:", poolName);
    console.log("Token A Reserve Range:", ranges.tokenAReserveRange);
    console.log("Token B Reserve Range:", ranges.tokenBReserveRange);
}

main().catch(console.error);
