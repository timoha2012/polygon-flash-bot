import "@nomicfoundation/hardhat-ethers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Signer } from "ethers";
import { dexs } from "../data/dexs";
import { tokens } from "../data/tokens";
import { pools } from "../data/pools";
import { whales } from "../data/whales";

// ABI definition for ERC20 token interactions
const IERC20_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address recipient, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Test suite for the Arbitrage Contract
describe("Arbitrage Contract", function () {
    let flashloan: any; // Flashloan contract instance
    let deployer: Signer; // Deployer account signer
    let whale: Signer; // Whale account signer
    const whaleAddress: string = whales["Account1"].address; // Whale address from the data
    let fromTokenContract: any; // ERC20 token contract instance
    let transferAmount: any; // Amount to be transferred for testing

    // Pool and token information
    const poolName: string = "MATIC-WETH";
    const dexCombo: string[] = ["Uniswap", "Sushiswap"];
    const pool = pools[poolName];
    const tokenA = pool.tokenA.name;
    const tokenB = pool.tokenB.name;
    let tokenAAddr: string = tokens[tokenA].address;
    let tokenBAddr: string = tokens[tokenB].address;
    const decimals: number = tokens[tokenA].decimals; // Token decimals for precise calculations

    // Router addresses for different DEXs
    const uniswapRouterAddress: string = dexs["Uniswap"].router;
    const sushiswapRouterAddress: string = dexs["Sushiswap"].router;
    const quickswapRouterAddress: string = dexs["Quickswap"].router;
    const routerCombo: string[] = [dexs[dexCombo[0]].router, dexs[dexCombo[1]].router];

    // Setup before running tests
    before(async function () {
        // Get the deployer account from Hardhat's runtime environment
        [deployer] = await ethers.getSigners();

        // Impersonate a whale account for testing
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [whaleAddress],
        });
        whale = await ethers.getSigner(whaleAddress);

        // Initialize the fromToken ERC20 contract
        fromTokenContract = new ethers.Contract(tokenAAddr, IERC20_ABI, deployer);

        // Deploy the Flashloan contract
        const flashloanFactory = await ethers.getContractFactory("Flashloan", deployer);
        flashloan = await flashloanFactory.deploy();

        // Transfer tokens to the deployer, then to the flashloan contract for testing
        transferAmount = ethers.parseUnits("1", decimals);
        await fromTokenContract.connect(whale).transfer(await deployer.getAddress(), transferAmount);
        await fromTokenContract.connect(deployer).transfer(flashloan.address, transferAmount);
    });

    // Test case to check the execution of arbitrage
    it("should execute arbitrage successfully", async function () {
        const amount: string = "1"; // Amount for the flashloan
        const amountIn = ethers.parseUnits(amount, decimals); // Parsing amount to correct units
        const fee = 500; // Fee for the flashloan
        const _swapAddr = [tokenAAddr, tokenBAddr, tokenAAddr]; // Addresses for token swaps
        const _routerAddr = routerCombo; // Router addresses for swaps

        // Approve the flashloan contract to spend tokens
        await fromTokenContract.connect(deployer).approve(flashloan.address, amountIn);

        // Execute the flash loan and wait for the transaction to complete
        const tx = await flashloan.connect(deployer).executeFlashLoan(tokenAAddr, amountIn, _swapAddr, _routerAddr, fee, { gasLimit: 10000000 });
        await tx.wait();

        // Logging information for debugging and confirmation
        console.log("Pool:", poolName);
        console.log("Token A:", tokenA);
        console.log("Token B:", tokenB);
        console.log(`Swap1: ${tokenA}/${tokenB}, Swap2: ${tokenB}/${tokenA}`);
        console.log("Dex Combo: ", dexCombo);
        console.log(`Amount in: ${ethers.formatUnits(amountIn, decimals)} ${tokenA}`);
        console.log("Fee: ", fee);
    });
});
