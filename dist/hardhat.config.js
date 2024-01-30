"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("hardhat/config");
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-toolbox");
require("@typechain/hardhat");
// Custom task to generate TypeChain types for external ABIs
(0, config_1.task)("generate-typechain", "Generate Typechain typings for external ABIs", async (_, hre) => {
    await hre.run("compile");
    // Explicitly specify the path to the external ABI files
    const externalAbiFiles = "./external-abi/*.json";
    // Generate TypeChain types for the external ABIs
    await hre.run("typechain", {
        glob: externalAbiFiles,
    });
});
const config = {
    solidity: {
        compilers: [
            { version: "0.6.6" },
            { version: "0.8.19" },
        ],
    },
    paths: {
        artifacts: './artifacts',
        cache: './cache',
    },
    networks: {
        hardhat: {
            //gasPrice: 30000000000,
            forking: {
                url: "https://polygon-mainnet.infura.io/v3/662af0eda7054ad48aa535050c0e98fc",
                // blockNumber: 12345678
            },
        },
        localhost: {
            url: "http://127.0.0.1:8545"
        },
    },
};
exports.default = config;
