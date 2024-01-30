import "@nomicfoundation/hardhat-ethers";
import { ethers, network } from "hardhat";
import { expect } from "chai";
//import { FlashloanV2 } from "../typechain-types";
import { Signer } from "ethers";
import { pools2 } from "../data/pools2";
import { tokens } from "../data/tokens.ts";
import { dexs } from "../data/dexs.ts";
import { whales } from "../data/whales";

const IERC20_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address recipient, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

const pairContractABI = [
    'event Sync(uint112 reserve0, uint112 reserve1)',
    'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)'
];

describe("Trade Simulation", function () {
    let flashloan: any;
    let deployer: Signer;
    let whale: Signer;
    const whaleAddress: string = whales["Account1"].address;
    let fromtokencontract : any;
    let fromTokenContract : any;
    let transferAmount : any;

    const pool1 = "MATIC-WETH-SUSHI";
    const pool2 = "MATIC-WETH-QUICK";
    const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.g.alchemy.com/v2/MGBhU6nCDGDQdIt8OrvzBxxfgQlt1BXs");
    
    const poolAddress1 = pools2[pool1].address;
    const poolAddress2 = pools2[pool2].address;

    const pairContract1 = new ethers.Contract(poolAddress1, pairContractABI, provider);
    const pairContract2 = new ethers.Contract(poolAddress2, pairContractABI, provider);

    before(async function () {
        [deployer] = await ethers.getSigners();

        // impersonate whale account
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [whaleAddress],
            });
        whale = await ethers.getSigner(whaleAddress);

        // create the fromToken contract
        fromtokencontract = new ethers.Contract(tokenAAddr,IERC20_ABI,deployer);

        // deploy the Flashloan contract
        const flashloanFactory = await ethers.getContractFactory("FlashloanV2", deployer);
        flashloan = await flashloanFactory.deploy();

        // transfer fromToken to the deployer account, and then to the flashloan contract
        fromTokenContract = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", tokenAAddr, whale);
        transferAmount = ethers.parseUnits("1", decimals);
        await fromTokenContract.transfer(await deployer.getAddress(), transferAmount);
        await fromTokenContract.transfer(flashloan.getAddress(), transferAmount);
    });

    it("Should simulate trades with different sizes and slippages", async function () {
        const tradeSizes = [1000, 5000, 10000]; // Example trade sizes in your unit of choice
        const slippageTolerances = [0.5, 1, 1.5]; // Example slippage tolerances in percentages

        for (let size of tradeSizes) {
            for (let slippage of slippageTolerances) {
                const result1 = await simulateArb(size, slippage, pool1, pool2);

                //console.log(`Trade Size: ${size}, Slippage: ${slippage}, Pool1 Result: ${result1}, Pool2 Result: ${result2}`);
            }
        }
    });

    async function simulateArb(
        _size: number,
        _slippage: number,
        _poolId1: string,
        _poolId2: string
        ) {
        const token0Pool1: string = pools2[_poolId1].token0;
        const token1Pool1: string = pools2[_poolId1].token1;
        const dex1: string = pools2[_poolId1].dex;
        const dex2: string = pools2[_poolId2].dex;

        const swapAddr: string[] = [tokens[token0Pool1].address, tokens[token1Pool1].address, tokens[token0Pool1].address];
        const routerAddr: string[] = [dexs[dex1].router, dexs[dex2].router];

        const tokenAAddr: string = tokens[token0Pool1].address;
        const tx = await flashloan.executeFlashLoan(
            tokenAAddr,_size,swapAddr,routerAddr, {gasLimit: 10000000}
        );
        await tx.wait();
        console.log(`Trade size: ${_size} for transaction: ${tx}`);
        // This is a placeholder function, implement based on your requirements
        //return `Simulated flashloan for pool ${poolId} with trade size ${size} and slippage ${slippage}`;
    }
});
