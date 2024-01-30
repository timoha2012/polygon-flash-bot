import { ethers } from 'ethers';
import { pools } from '../data/pools';

// Configuration: Set up your Ethereum provider and the contract details.
const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.g.alchemy.com/v2/MGBhU6nCDGDQdIt8OrvzBxxfgQlt1BXs");
const pairContractAddress = pools["MATIC-WETH"].dex[0].pool; // SUSHISWAP MATIC-WETH pool
const pairContractABI = [ // Simplified ABI with relevant events
    'event Sync(uint112 reserve0, uint112 reserve1)',
    'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)'
];

let Reserve0: bigint;
let Reserve1: bigint;

function calcPrice(reserve0: bigint, reserve1: bigint) {
    const priceOfToken1 = Number(reserve0) / Number(reserve1);
    const priceOfToken0 = Number(reserve1) / Number(reserve0);
    console.log(`Price of Token1 in terms of Token0: ${priceOfToken1}`);
    console.log(`Price of Token0 in terms of Token1: ${priceOfToken0}`);
}

async function monitorLiquidityPool() {
    const pairContract = new ethers.Contract(pairContractAddress, pairContractABI, provider);

    // Listening to the Sync event.
    pairContract.on('Sync', (reserve0: bigint, reserve1: bigint) => {
        console.log(`Sync Event: New Reserves - reserve0: ${reserve0.toString()}, reserve1: ${reserve1.toString()}`);
        Reserve0 = reserve0;
        Reserve1 = reserve1;
        calcPrice(reserve0, reserve1);
    });

    // Listening to the Swap event.
    pairContract.on('Swap', (sender: string, amount0In: bigint, amount1In: bigint, amount0Out: bigint, amount1Out: bigint, to: string) => {
        console.log(`Swap Event: sender: ${sender}, amount0In: ${amount0In.toString()}, amount1In: ${amount1In.toString()}, amount0Out: ${amount0Out.toString()}, amount1Out: ${amount1Out.toString()}, to: ${to}`);
        
        Reserve0 = (Reserve0 + amount0In) - amount0Out;
        Reserve1 = (Reserve1 + amount1In) - amount1Out;

        calcPrice(Reserve0, Reserve1);
    });

    console.log('Monitoring liquidity pool...');
}

monitorLiquidityPool().catch((error) => {
    console.error(error);
    process.exit(1);
});
