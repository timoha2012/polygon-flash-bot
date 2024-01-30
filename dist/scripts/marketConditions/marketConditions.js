"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMarketCombinationsToFile = void 0;
const fs_1 = __importDefault(require("fs"));
// Function to generate market combinations and write to a JSON file
function generateMarketCombinationsToFile(tokenAReserveRange, tokenBReserveRange, gasPriceRange, fileName) {
    let marketCombinations = [];
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
    fs_1.default.writeFile(fileName, JSON.stringify(marketCombinations, null, 2), (err) => {
        if (err) {
            console.error(`Error writing file ${fileName}:`, err);
        }
        else {
            console.log(`${fileName} created successfully.`);
        }
    });
}
exports.generateMarketCombinationsToFile = generateMarketCombinationsToFile;
// Example usage
const tokenAReserveRange = { min: 1000, max: 10000, step: 1000 }; // Example range for tokenA
const tokenBReserveRange = { min: 10, max: 100, step: 10 }; // Example range for tokenB
const gasPriceRange = { min: 30, max: 130, step: 10 }; // Example range in Gwei
const poolName = 'MATIC_WETH'; // Example pool name
const fileName = `${poolName}_marketCombinations.json`; // Generate file name based on pool name
generateMarketCombinationsToFile(tokenAReserveRange, tokenBReserveRange, gasPriceRange, fileName);
