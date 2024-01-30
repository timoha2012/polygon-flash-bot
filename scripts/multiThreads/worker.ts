import { ethers } from 'ethers';
import { parentPort, workerData } from 'worker_threads';

let Reserve0: bigint;
let Reserve1: bigint;

const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.g.alchemy.com/v2/MGBhU6nCDGDQdIt8OrvzBxxfgQlt1BXs");

const pairContractABI = [
    'event Sync(uint112 reserve0, uint112 reserve1)',
    'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)'
];

function calcPrice(reserve0: bigint, reserve1: bigint) {
    const priceOfToken0 = Number(reserve1) / Number(reserve0);
    const priceOfToken1 = Number(reserve0) / Number(reserve1);
    return { priceOfToken0, priceOfToken1 };
}

function setupPoolListeners(poolData: any) {
    const { address, dex, token0, token1 } = poolData;
    const poolIdentifier = `${token0}-${token1}-${dex}`;

    const pairContract = new ethers.Contract(address, pairContractABI, provider);

    pairContract.on('Sync', (reserve0: bigint, reserve1: bigint) => {
        console.log(`Sync event detected on ${poolIdentifier}`);
        Reserve0 = reserve0;
        Reserve1 = reserve1;
    
        const prices = calcPrice(Reserve0, Reserve1);
        if (parentPort) {
            parentPort.postMessage({prices, poolIdentifier});
        }
    });

    pairContract.on('Swap', (sender: string, amount0In: bigint, amount1In: bigint, amount0Out: bigint, amount1Out: bigint, to: string) => {
        console.log(`Swap event detected on ${poolIdentifier}`);
        Reserve0 = (Reserve0 + amount0In) - amount0Out;
        Reserve1 = (Reserve1 + amount1In) - amount1Out;
    
        const prices = calcPrice(Reserve0, Reserve1);
        if (parentPort) {
            parentPort.postMessage({prices, poolIdentifier});
        }
    });

    console.log(`Listener set up for ${poolIdentifier} at address: ${address}`);
}

const pools = workerData.pools;

pools.forEach(setupPoolListeners);


if (!parentPort) {
    console.error('This script must be run as a worker thread.');
}
