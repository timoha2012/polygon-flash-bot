import { Contract } from 'ethers';
import { ethers } from 'ethers';
import * as fs from 'fs';
import trades2 from "../../data/trades/trades2.json";
import { tokens } from '../../data/tokens';


// Function to generate a grid of reserve pairs
function generateReserveGrid(reserve0: number, reserve1: number, deviation: number, granularity: number, decA: number, decB: number): Array<[number, number]> {
    let grid: Array<[number, number]> = [];

    for (let i = -granularity; i <= granularity; i++) {
        for (let j = -granularity; j <= granularity; j++) {
            let newReserve0 = BigInt(Number(reserve0) * (1 + deviation * i / granularity));
            let newReserve1 = BigInt(Number(reserve1) * (1 + deviation * j / granularity));

            let formattedReserve0 = Number(ethers.formatUnits(newReserve0, decA));
            let formattedReserve1 = Number(ethers.formatUnits(newReserve1, decB));

            grid.push([formattedReserve0, formattedReserve1]);
        }
    }

    return grid;
}


// Function to check if current reserves are within the grid
function isWithinGrid(reserve0: number, reserve1: number, grid: Array<[number, number]>): boolean {
    return grid.some(([r0, r1]) => reserve0 <= r0 && reserve1 <= r1);
}

// Function to update the JSON file with the new grid
function updateJsonFile(fileName: string, data: any): void {
    fs.writeFile(fileName, JSON.stringify(data, null, 2), (err) => {
        if (err) throw err;
        console.log(`${fileName} has been updated.`);
    });
}

// Main monitoring function with customizable parameters
async function monitorAndUpdateGrid(poolAddress: string, deviation: number, granularity: number, decA: number, decB: number) {
    const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/55cea695d27f459b9bfc24c28083be5c");
    const poolAbi = ['function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'];
    const contractInstance = new Contract(poolAddress, poolAbi, provider);
    const jsonFileName = 'reserveGrid.json';

    try {
        let [initialReserve0, initialReserve1] = await contractInstance.getReserves();
        let reserveGrid = generateReserveGrid(initialReserve0, initialReserve1, deviation, granularity, decA, decB);

        // Check range and granularity
        const maxReserve0 = Number(initialReserve0) * (1 + deviation);
        const minReserve0 = Number(initialReserve0) * (1 - deviation);
        const maxReserve1 = Number(initialReserve1) * (1 + deviation);
        const minReserve1 = Number(initialReserve1) * (1 - deviation);

        const firstElement = reserveGrid[0];
        const lastElement = reserveGrid[reserveGrid.length - 1];

        if (firstElement[0] <= minReserve0 && lastElement[0] >= maxReserve0 &&
            firstElement[1] <= minReserve1 && lastElement[1] >= maxReserve1) {
            console.log("Range correctly represents the entire deviation.");
        } else {
            console.log("Range does not correctly represent the entire deviation.");
        }

        const expectedCount = Math.pow(2 * granularity + 1, 2);
        if (reserveGrid.length === expectedCount) {
            console.log("Granularity correctly represented in the grid.");
        } else {
            console.log("Granularity not correctly represented in the grid.");
        }

        updateJsonFile(jsonFileName, reserveGrid);

        setInterval(async () => {
            let [newReserve0, newReserve1] = await contractInstance.getReserves();

            if (!isWithinGrid(newReserve0, newReserve1, reserveGrid)) {
                reserveGrid = generateReserveGrid(newReserve0, newReserve1, deviation, granularity, decA, decB);
                updateJsonFile(jsonFileName, reserveGrid);
            }
        }, 10000); // Check every 10 seconds

    } catch (error) {
        console.error("Error: ", error);
    }
}

// Example usage
const poolAddress = trades2[0].dexs.pool[0];
const deviation = 0.05; // 5% deviation
const granularity = 10; // Number of steps in each direction
const decA = tokens[trades2[0].tokens.name[0]].decimals;
const decB = tokens[trades2[0].tokens.name[1]].decimals;
monitorAndUpdateGrid(poolAddress, deviation, granularity, decA, decB);
