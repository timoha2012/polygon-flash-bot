import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Signer } from "ethers";
import { Flashloan } from "../typechain-types";
import { dexs } from "../data/dexs";
import { tokens } from "../data/tokens";
import { pools } from "../data/pools";
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

describe("Arbitrage Contract", function () {
    let flashloan: any;
    let deployer: Signer;
    let whale: Signer;
    const whaleAddress: string = whales["Account1"].address;
    let fromtokencontract : any;
    let fromTokenContract : any;
    let transferAmount : any;

    const poolName : string = "MATIC-WETH";
    const dexCombo : string[] = ["Uniswap","Sushiswap"];

    const pool = pools[poolName];
    const tokenA = pool.tokenA.name;
    const tokenB = pool.tokenB.name;
    let tokenAAddr: string = tokens[tokenA].address;
    let tokenBAddr: string = tokens[tokenB].address;
    const decimals : number = tokens[tokenA].decimals;

    const uniswapRouterAddress: string = dexs["Uniswap"].router;
    const sushiswapRouterAddress: string = dexs["Sushiswap"].router;
    const quickswapRouterAddress: string = dexs["Quickswap"].router;
    const routerCombo : string[] = [dexs[dexCombo[0]].router, dexs[dexCombo[1]].router]

    before(async function () {
        // get deployer account
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
        const flashloanFactory = await ethers.getContractFactory("Flashloan", deployer);
        flashloan = await flashloanFactory.deploy();

        // transfer fromToken to the deployer account, and then to the flashloan contract
        fromTokenContract = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", tokenAAddr, whale);
        transferAmount = ethers.parseUnits("1", decimals);
        await fromTokenContract.transfer(await deployer.getAddress(), transferAmount);
        await fromTokenContract.transfer(flashloan.getAddress(), transferAmount);

    });

    it("should execute arbitrage successfully", async function () {
        const amount : string = "1";
        
        const amountIn = ethers.parseUnits(amount, decimals);
        const fee = 500;
        const _swapAddr = [tokenAAddr,tokenBAddr,tokenAAddr];
        const _routerAddr = routerCombo;
        await fromTokenContract.approve(flashloan.getAddress(), amountIn);

        const tx = await flashloan.connect(deployer).executeFlashLoan(tokenAAddr,amountIn,_swapAddr,_routerAddr,fee, {gasLimit: 10000000});
        await tx.wait();

        console.log("Pool:", poolName);
        console.log("Token A:", tokenA);
        console.log("Token B:", tokenB);
        console.log(`Swap1: ${tokenA}/${tokenB}, Swap2: ${tokenB}/${tokenA}`)
        console.log("Dex Combo: ", dexCombo);
        console.log(`Amount in: ${ethers.formatUnits(amountIn, decimals)} ${tokenA}`);
        console.log("Fee: ", fee);

    });

});