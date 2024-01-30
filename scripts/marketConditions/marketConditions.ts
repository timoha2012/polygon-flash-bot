import fs from 'fs';

// Define range types
type Range = {
    min: number;
    max: number;
    step: number;
};

// Define a type for market combination
type MarketCombination = {
    tokenAReserve: number;
    tokenBReserve: number;
    gasPrice: number;
};

// Function to generate market combinations and write to a JSON file
export function generateMarketCombinationsToFile(
    tokenAReserveRange: Range, 
    tokenBReserveRange: Range, 
    gasPriceRange: Range,
    fileName: string
): void {
    let marketCombinations: MarketCombination[] = [];

    for (let tokenARes = tokenAReserveRange.min; tokenARes <= tokenAReserveRange.max; tokenARes += tokenAReserveRange.step) {
        for (let tokenBRes = tokenBReserveRange.min; tokenBRes <= tokenBReserveRange.max; tokenBRes += tokenBReserveRange.step) {
            for (let gasPrice = gasPriceRange.min; gasPrice <= gasPriceRange.max; gasPrice += gasPriceRange.step) {
                marketCombinations.push({ 
                    tokenAReserve: tokenARes, 
                    tokenBReserve: tokenBRes, 
                    gasPrice 
                });
            }
        }
    }

    // Write the combinations to a JSON file
    fs.writeFile(fileName, JSON.stringify(marketCombinations, null, 2), (err) => {
        if (err) {
            console.error(`Error writing file ${fileName}:`, err);
        } else {
            console.log(`${fileName} created successfully.`);
        }
    });
}

// Example usage
const tokenAReserveRange: Range = { min: 1000, max: 10000, step: 1000 }; // Example range for tokenA
const tokenBReserveRange: Range = { min: 10, max: 100, step: 10 }; // Example range for tokenB
const gasPriceRange: Range = { min: 30, max: 130, step: 10 }; // Example range in Gwei

const poolName = 'MATIC_WETH'; // Example pool name
const fileName = `${poolName}_marketCombinations.json`; // Generate file name based on pool name

generateMarketCombinationsToFile(tokenAReserveRange, tokenBReserveRange, gasPriceRange, fileName);
