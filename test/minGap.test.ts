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
    calcMinGap,
    calcOptimalTradeSize
 } from "../scripts/utils/general";

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

describe("Price Gap Test", function() {
    this.timeout(0);
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
    let inputAmount: string = "100";
    const i = 0;
    const perc = 0.5;
    let balance: any;
    const riskTolerance = 50; // 50%
    const minProfitMargin = 5; // 5%
    const maxTradeSize = new BigNumber("1000000000000000000");
    const expSlippage = 0.001; // 1%
    let gasMATIC: BigNumber;
    let gasTokenA: BigNumber | null;
    let pool1PriceB: BigNumber;
    let pool2PriceB: BigNumber;

    const priceGaps = [0.005, 0.006, 0.007, 0.008, 0.009, 0.01, 0.011, 0.012, 0.013, 0.014, 0.015, 0.016, 0.017, 0.018, 0.019, 0.02];

    before(async function () {
        [deployer] = await ethers.getSigners();
        poolContract1 = new ethers.Contract(trades2[i].dexs.pool[0], uniswapV2PairABI, provider);
        poolContract2 = new ethers.Contract(trades2[i].dexs.pool[1], uniswapV2PairABI, provider);


        gasMATIC = new BigNumber("0.003996468971063496");
        gasTokenA = await convertMaticToToken("TokenA", gasMATIC, provider);
        const pool1Price = await getResPrice(poolContract1, decA, decB);
        const pool2Price = await getResPrice(poolContract2, decA, decB);
        pool1PriceB = pool1Price.bnPriceB;
        pool2PriceB = pool2Price.bnPriceB;
        

        tokenAName = trades2[i].tokens.name[0];
        tokenBName = trades2[i].tokens.name[1];
        tokenAAddr = trades2[i].tokens.address[0];
        tokenBAddr = trades2[i].tokens.address[1];
        decA = tokens[tokenAName].decimals;
        decB = tokens[tokenBName].decimals;

        const flashloanFactory = await ethers.getContractFactory("FlashloanV2", deployer);
        flashloan = await flashloanFactory.deploy();

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

    it("print", async function() {
        console.log(pool1PriceB.toFixed());
        console.log(pool2PriceB.toFixed());
    })

    
    priceGaps.forEach(gap => {
        it(`should calc trade size for a price gap of ${(gap * 100).toFixed(1)}%`, async function() {
            const higherPriceB = pool1PriceB.multipliedBy(1 + gap);

            console.log("pool1 price B: ", pool1PriceB.toFixed());
            console.log("pool2 price B: ", higherPriceB.toFixed());

            const tradeSize = calcOptimalTradeSize(gap,gasTokenA,)


            //const amountIn = transferAmount;
            //const _swapAddr = [tokenAAddr,tokenBAddr,tokenAAddr];
            //const _routerAddr = trades2[i].dexs.router;
            //await fromTokenContract.approve(flashloan.getAddress(), amountIn);

            //const tx = await flashloan.connect(deployer).executeFlashLoan(tokenAAddr,amountIn,_swapAddr,_routerAddr,{gasLimit: 10000000});
            //const r = await tx.wait();

        });
    });
    
});