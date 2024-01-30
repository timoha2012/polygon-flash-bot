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
import BigNumber from "bignumber.js";
import { convertMaticToToken } from "../scripts/utils/convertMaticToToken";
import { getExchangeRate } from "../scripts/utils/getExchangeRate";
import { 
    calcRevenue, 
    calcTotalCosts, 
    getResPrice, 
    calcNewRes, 
    calcTradeSize,
    calcMinGap
 } from "../scripts/utils/general";

//const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/55cea695d27f459b9bfc24c28083be5c");
const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.g.alchemy.com/v2/MGBhU6nCDGDQdIt8OrvzBxxfgQlt1BXs");

const uniswapV2PairABI = [
    'function getReserves() external view returns (uint112, uint112, uint32)',
    'event Sync(uint112 reserve0, uint112 reserve1)'
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
    let poolContract1: any;
    let poolContract2: any;
    let resPricePool1: any;
    let resPricePool2: any;

    let tokenAName: string;
    let tokenBName: string;
    let tokenAAddr: string;
    let tokenBAddr: string;
    let decA: number;
    let decB: number;
    let amountIn: any;
    const i = 0;
    const perc = 0.4;
    const perc2 = 0.1;
    let balance: any;
    const priceGap: number = 0.9;
    const poolFeePerc = 0.6;
    
    
    before(async function () {
        [deployer] = await ethers.getSigners();
        poolContract1 = new ethers.Contract(trades2[i].dexs.pool[0], uniswapV2PairABI, provider);
        poolContract2 = new ethers.Contract(trades2[i].dexs.pool[1], uniswapV2PairABI, provider);

        const flashloanFactory = await ethers.getContractFactory("FlashloanV2", deployer);
        flashloan = await flashloanFactory.deploy();

        tokenAName = trades2[i].tokens.name[0];
        tokenBName = trades2[i].tokens.name[1];
        tokenAAddr = trades2[i].tokens.address[0];
        tokenBAddr = trades2[i].tokens.address[1];
        decA = tokens[tokenAName].decimals;
        decB = tokens[tokenBName].decimals;
        console.log("token a addr: ", tokenAAddr);

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [whaleAddress],
        });
        whale = await ethers.getSigner(whaleAddress);


        fromtokencontract = new ethers.Contract(tokenAAddr,IERC20_ABI,deployer);
        fromTokenContract = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", tokenAAddr, whale);
        resPricePool1 = await getResPrice(poolContract1,decA,decB);
        resPricePool2 = await getResPrice(poolContract2,decA,decB);
        transferAmount = BigInt(calcTradeSize(resPricePool1.bnReserveA,perc));

        await fromTokenContract.transfer(await deployer.getAddress(), transferAmount);
        await fromTokenContract.transfer(flashloan.getAddress(), transferAmount);


    });

    it("should execute arbitrage successfully", async function () {
        amountIn = transferAmount;
        const _swapAddr = [tokenAAddr,tokenBAddr,tokenAAddr];
        const _routerAddr = trades2[i].dexs.router;
        await fromTokenContract.approve(flashloan.getAddress(), amountIn);

        const tx = await flashloan.connect(deployer).executeFlashLoan(tokenAAddr,amountIn,_swapAddr,_routerAddr,{gasLimit: 10000000});
        const r = await tx.wait();

        const totalGas = (r.gasPrice) * (r.gasUsed);
        const totalGasBn = new BigNumber(totalGas);
        //const totalGasF = ethers.formatUnits(totalGas,18);
        //const gasPriceGwei = ethers.formatUnits(r.gasPrice, 'gwei');
        //const gasPriceMatic = ethers.formatUnits(r.gasPrice, 'ether');

        const { newReserveA, newReserveB, newPriceA, newPriceB } = calcNewRes(resPricePool1.bnReserveA, resPricePool1.bnReserveB, Number(amountIn));

        //const priceBDelta =  resPricePool1.bnPriceB.minus(newPriceB); // new price - initial price 
        const priceBDelta: any =  newPriceB.minus(resPricePool1.bnPriceB); // new price - initial price 
        const slippagePerc: any = priceBDelta.abs().dividedBy(resPricePool1.bnPriceB).multipliedBy(100);
        
        const priceBPool1 = resPricePool1.bnPriceB;
        const priceBPool2 = resPricePool2.bnPriceB;
        const tradeSizeTokenB = new BigNumber(amountIn).dividedBy(resPricePool1.bnPriceB);
        let potentialRevenue = calcRevenue(priceBPool1, priceBPool2, tradeSizeTokenB);
        potentialRevenue = BigInt(potentialRevenue.toFixed(0));
        potentialRevenue = ethers.formatUnits(potentialRevenue,decA);

        let gasTokenABn: any = await convertMaticToToken(tokenAName,totalGasBn,provider);
        let gasTokenA: any;
        if(gasTokenABn) {
            gasTokenA = BigInt(gasTokenABn.toFixed(0));
            gasTokenA = ethers.formatUnits(gasTokenA,decA);
        }

        const totalTradeCost = calcTotalCosts(Number(amountIn), Number(poolFeePerc), Number(slippagePerc), Number(gasTokenA));
        const totalTradeCostBn = new BigNumber(totalTradeCost);
        const totalCostsWETH = gasTokenABn.plus(totalTradeCostBn);

        //let { minGap, minGapPerc } = calcMinGap(totalCostsWETH,tradeSizeTokenB,resPricePool1.bnPriceB);

        let poolFeeA: any = Number(amountIn) * (perc / 100);
        poolFeeA = Number(ethers.formatUnits(BigInt(poolFeeA),decA));


        let revenue: any = Number(amountIn) * (priceGap / 100);
        let slippageCost: any = Number(amountIn) * (slippagePerc / 100);
        const totalCosts = slippageCost + Number(gasTokenA) + poolFeeA;
        let totalProfit: any = revenue - totalCosts;

        // Formatting
        totalProfit = Number(ethers.formatUnits(BigInt(totalProfit),decA)).toFixed(2);
        slippageCost = Number(ethers.formatUnits(BigInt(slippageCost),decA)).toFixed(2);
        const amountInf = Number(ethers.formatUnits(amountIn, decA)).toFixed(2);
        poolFeeA = Number(poolFeeA).toFixed(2);
        revenue = Number(ethers.formatUnits(BigInt(revenue),decA)).toFixed(2);

        const res1 = Number(ethers.formatUnits(BigInt((resPricePool1.bnReserveA).toFixed(0)), decA)).toFixed(0);

        console.log("amount in before:", amountIn);
        console.log(`amount in after: ${Number(amountIn)}`);
    
        console.log("Pool:", trades2[i].pool);
        console.log("Token A:", tokenAName);
        console.log("Token B:", tokenBName);
        console.log(`Swap1: ${tokenAName}/${tokenBName}, Swap2: ${tokenBName}/${tokenAName}`);
        console.log("Dex Combo: ", trades2[i].dexs.name);

        console.log("---------------------------");
        console.log(`Price gap: ${priceGap}%`);
        console.log(`Amount in: ${amountInf} ${tokenAName} (${perc}% of ${res1} ${tokenAName} reserves)`);
        console.log(`Revenue: ${revenue} ${tokenAName}`);
        console.log(`Slippage Costs: ${slippageCost} ${tokenAName} (${slippagePerc.toFixed(2)}%)`);
        console.log(`Total gas cost: ${gasTokenA} ${tokenAName}`);
        console.log(`Pool Fees: ${poolFeeA} ${tokenAName}`);
        console.log(`Total Profit: ${totalProfit} ${tokenAName}`);
        console.log("---------------------------");
        
        //console.log(`Total gas cost: ${totalGasF} MATIC`);
        //console.log(`Total trade cost: ${ethers.formatUnits(BigInt(totalTradeCost),decA)} ${tokenAName}`);
        //console.log(`Potential revenue: ${potentialRevenue} ${tokenAName}`);

        //console.log(`${tokenBName} price delta after trade: ${priceBDelta.toFixed()}`);

        //console.log(`Gas price gwei: ${gasPriceGwei}`);
        //console.log(`Gas Price: ${gasPriceMatic} MATIC`);
        //console.log(`Gas Units Used: ${Number(r.gasUsed)}`);


    });

});