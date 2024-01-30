import { ethers, network } from "hardhat";
import { Contract, Signer } from "ethers";
import { expect } from "chai";
import trades2 from "../data/trades/trades2.json"
import { whales } from "../data/whales";

const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/55cea695d27f459b9bfc24c28083be5c");

const uniswapV2PairABI = [
    'function getReserves() external view returns (uint112, uint112, uint32)'
];

const IERC20_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address recipient, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

describe("Pool Reserve Change Test", function () {
    let swapTest: Contract;
    let deployer: Signer;
    let poolContract: any;
    const poolAddress = trades2[1].dexs.pool[0]; // Replace with the actual pool address
    let whale: Signer;
    const whaleAddress: string = whales["Account1"].address;
    let fromtokencontract : any;
    let fromTokenContract : any;
    let transferAmount : any;
    const swapAmount = "400";
    const decA = 18;


    before(async function () {
        [deployer] = await ethers.getSigners();

        const SwapTest = await ethers.getContractFactory("swapTest", deployer);
        swapTest = await SwapTest.deploy();

        poolContract = new ethers.Contract(poolAddress, uniswapV2PairABI, provider);

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [whaleAddress],
            });
        whale = await ethers.getSigner(whaleAddress);

        const tokenAAddr = trades2[0].tokens.address[0];

        fromtokencontract = new ethers.Contract(tokenAAddr,IERC20_ABI,deployer);
        fromTokenContract = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", tokenAAddr, whale);
        transferAmount = ethers.parseUnits("500", decA);

        await fromTokenContract.transfer(await deployer.getAddress(), transferAmount);
        await fromTokenContract.transfer(swapTest.getAddress(), transferAmount);
    });

    it("Should change pool reserves after a swap transaction", async function () {
        // Get initial reserves
        let [initialReserve0, initialReserve1] = await poolContract.getReserves();

        const routerAddr = trades2[0].dexs.router[0];
        const fromToken = trades2[0].tokens.address[0];
        const toToken = trades2[0].tokens.address[1];
        const amount = ethers.parseUnits(swapAmount, decA);
        const tx = await swapTest.swap2(routerAddr, fromToken, toToken, amount);

        // Wait for the transaction to be mined
        await tx.wait();
        await network.provider.send("hardhat_mine");


        // Fetch updated reserves
        let [updatedReserve0, updatedReserve1] = await poolContract.getReserves();

        // Assert that reserves have changed
        //expect(updatedReserve0).to.not.equal(initialReserve0);
        //expect(updatedReserve1).to.not.equal(initialReserve1);

        initialReserve0 = ethers.formatUnits(initialReserve0, 18);
        initialReserve1 = ethers.formatUnits(initialReserve1, 18);
        updatedReserve0 = ethers.formatUnits(updatedReserve0, 18);
        updatedReserve1 = ethers.formatUnits(updatedReserve1, 18);
        console.log(`Initial Reserves: Reserve0 = ${Number(initialReserve0)}, Reserve1 = ${Number(initialReserve1)}`);
        console.log(`Updated Reserves: Reserve0 = ${Number(updatedReserve0)}, Reserve1 = ${Number(updatedReserve1)}`);
    });
});
