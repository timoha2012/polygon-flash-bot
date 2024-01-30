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
    //calcTradeSize,
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
    let routerCombo: string[];
    const i = 0;
    const perc = 0.01;
    let balance: any;
    const priceGap: number = 1.9;
    const poolFeePerc = 0.6;
    let transferAmountBi: BigInt;

    function calcTradeSize(reserveAmount: BigNumber, percentage: BigNumber) {
        console.log(reserveAmount.toFixed(), percentage.toFixed());
        const decimalPercentage = percentage.dividedBy(100);
        const tradeSize = reserveAmount.multipliedBy(decimalPercentage);
        return tradeSize;
    }
    
    
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

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [whaleAddress],
        });
        whale = await ethers.getSigner(whaleAddress);

        fromtokencontract = new ethers.Contract(tokenAAddr,IERC20_ABI,deployer);
        fromTokenContract = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", tokenAAddr, whale);
        resPricePool1 = await getResPrice(poolContract1,decA,decB);
        resPricePool2 = await getResPrice(poolContract2,decA,decB);
        const percBn = new BigNumber(perc);
        transferAmount = calcTradeSize(resPricePool1.bnReserveA,percBn);
        transferAmountBi = BigInt(transferAmount.toFixed(0));

        await fromTokenContract.transfer(await deployer.getAddress(), transferAmountBi);
        await fromTokenContract.transfer(flashloan.getAddress(), transferAmountBi);

    });

    it("calculate trade amount correctly", async function () {
        console.log(transferAmount.toFixed());
        console.log(ethers.formatUnits(BigInt(transferAmount.toFixed(0)),decA));
    });

});