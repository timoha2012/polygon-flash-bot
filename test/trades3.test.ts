import "@nomicfoundation/hardhat-ethers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Signer } from "ethers";
import { Flashloan } from "../typechain-types";
import { dexs } from "../data/dexs";
import { tokens } from "../data/tokens";
import { pools } from "../data/pools";
import { whales } from "../data/whales";
import trades2 from "../data/trades/trades2.json"
import { PoolInfo } from "../data/types";
//import { getResPrice } from "../scripts/getReservesPrice";

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

describe("Arbitrage Contract", function () {
    this.timeout(0);
    let flashloan: any;
    let deployer: Signer;
    let whale: Signer;
    const whaleAddress: string = whales["Account1"].address;
    let fromtokencontract : any;
    let fromTokenContract : any;
    let transferAmount : any;

    let tokenAName: string;
    let tokenBName: string;
    let tokenAAddr: string;
    let tokenBAddr: string;
    let decA: number;
    let decB: number;
    let routerCombo: string[];

    before(async function () {
        [deployer] = await ethers.getSigners();

        const flashloanFactory = await ethers.getContractFactory("FlashloanV2", deployer);
        flashloan = await flashloanFactory.deploy();

        //for(let i=0; i<trades2.length; i++) {
        for(let i=0; i<1; i++) {
            tokenAName = trades2[i].tokens.name[0];
            tokenBName = trades2[i].tokens.name[1];
            tokenAAddr = trades2[i].tokens.address[0];
            tokenBAddr = trades2[i].tokens.address[1];
            decA = tokens[tokenAName].decimals;

            await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [whaleAddress],
                });
            whale = await ethers.getSigner(whaleAddress);

            fromtokencontract = new ethers.Contract(tokenAAddr,IERC20_ABI,deployer);
            fromTokenContract = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", tokenAAddr, whale);
            transferAmount = (tokenAName == "WBTC" || tokenBName == "WBTC") ? ethers.parseUnits("0.005", decA) : ethers.parseUnits("100", decA);

            await fromTokenContract.transfer(await deployer.getAddress(), transferAmount);
            await fromTokenContract.transfer(flashloan.getAddress(), transferAmount);
        }
        

    });

    async function getResPrice(_contract: any , _decA: number, _decB: number) {
                
        const reserves = await _contract.getReserves();
    
        const reserveTokenA = BigInt(reserves[1].toString());
        const reserveTokenB = BigInt(reserves[0].toString());
    
        const priceTokenA = Number(reserveTokenB) / Number(reserveTokenA);
        const priceTokenB = Number(reserveTokenA) / Number(reserveTokenB);
    
        return { reserveTokenA, reserveTokenB, priceTokenA, priceTokenB };
    }

    it("should execute arbitrage successfully", async function () {
        //for(let i=0; i<trades2.length; i++) {
        for(let i=0; i<1; i++) {
            const poolContract = new ethers.Contract(trades2[i].dexs.pool[0], uniswapV2PairABI, provider);
            
            tokenAName = trades2[i].tokens.name[0];
            tokenBName = trades2[i].tokens.name[1];
            tokenAAddr = trades2[i].tokens.address[0];
            tokenBAddr = trades2[i].tokens.address[1];
            decA = tokens[tokenAName].decimals;
            decB = tokens[tokenBName].decimals;

            const beforeResPrices = await getResPrice(poolContract, decA, decB);
            
            console.log("--------");
            console.log("Before trade reserves and prices: ");
            console.log(`${tokenAName} reserves: ${ethers.formatUnits(beforeResPrices.reserveTokenA, decA)}`);
            console.log(`${tokenBName} reserves: ${ethers.formatUnits(beforeResPrices.reserveTokenB, decB)}`);
            console.log("Token A price: ", beforeResPrices.priceTokenA);
            console.log("Token B price: ", beforeResPrices.priceTokenB);
            console.log("--------");

            const amount : string = (tokenAName == "WBTC" || tokenBName == "WBTC") ? "0.005" :  "100";
            const amountIn = ethers.parseUnits(amount, decA);
            const _swapAddr = [tokenAAddr,tokenBAddr,tokenAAddr];
            const _routerAddr = trades2[i].dexs.router;
            await fromTokenContract.approve(flashloan.getAddress(), amountIn);

            const currentBlock1 = await ethers.provider.getBlockNumber();
            console.log("Current Block:", currentBlock1);

            const tx = await flashloan.connect(deployer).executeFlashLoan(tokenAAddr,amountIn,_swapAddr,_routerAddr,{gasLimit: 10000000});
            await tx.wait();

            //console.log(tx);

            const currentBlock2 = await ethers.provider.getBlockNumber();
            console.log("Current Block:", currentBlock2);

            const updatedResPrices = await getResPrice(poolContract, decA, decB);
            console.log("--------");
            console.log("After trade reserves and prices: ");
            console.log(`${tokenAName} reserves: ${ethers.formatUnits(updatedResPrices.reserveTokenA, decA)}`);
            console.log(`${tokenBName} reserves: ${ethers.formatUnits(updatedResPrices.reserveTokenB, decB)}`);
            console.log("Token A price: ", updatedResPrices.priceTokenA);
            console.log("Token B price: ", updatedResPrices.priceTokenB);
            console.log("--------");


            console.log("Pool:", trades2[i].pool);
            console.log("Token A:", tokenAName);
            console.log("Token B:", tokenBName);
            console.log(`Swap1: ${tokenAName}/${tokenBName}, Swap2: ${tokenBName}/${tokenAName}`)
            console.log("Dex Combo: ", trades2[i].dexs.name);
            console.log(`Amount in: ${ethers.formatUnits(amountIn, decA)} ${tokenAName}`);
        }

    });

});