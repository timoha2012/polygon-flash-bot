"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("@nomicfoundation/hardhat-ethers");
const hardhat_1 = require("hardhat");
const tokens_1 = require("../data/tokens");
const whales_1 = require("../data/whales");
const trades2_json_1 = __importDefault(require("../data/trades/trades2.json"));
const bignumber_js_1 = __importDefault(require("bignumber.js"));
//const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/55cea695d27f459b9bfc24c28083be5c");
const provider = new hardhat_1.ethers.JsonRpcProvider("https://polygon-mumbai.g.alchemy.com/v2/Q0iw05Ps4B9YV10FMtVUSBOzxNKVoV2x");
const pairContractABI = [
    'function getReserves() external view returns (uint112, uint112, uint32)',
    'event Sync(uint112 reserve0, uint112 reserve1)',
    'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)'
];
describe("Arbitrage Contract", function () {
    this.timeout(0);
    let flashloan;
    let deployer;
    let whale;
    const whaleAddress = whales_1.whales["Account1"].address;
    let fromtokencontract;
    let fromTokenContract;
    let transferAmount;
    let tokenAName;
    let tokenBName;
    let tokenAAddr;
    let tokenBAddr;
    let decA;
    let decB;
    let routerCombo;
    let inputAmount = "400";
    before(async function () {
        [deployer] = await hardhat_1.ethers.getSigners();
        const flashloanFactory = await hardhat_1.ethers.getContractFactory("FlashloanV2", deployer);
        flashloan = await flashloanFactory.deploy();
        //for(let i=0; i<trades2.length; i++) {
        for (let i = 0; i < 1; i++) {
            tokenAName = trades2_json_1.default[i].tokens.name[0];
            tokenBName = trades2_json_1.default[i].tokens.name[1];
            tokenAAddr = trades2_json_1.default[i].tokens.address[0];
            tokenBAddr = trades2_json_1.default[i].tokens.address[1];
            decA = tokens_1.tokens[tokenAName].decimals;
            await hardhat_1.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [whaleAddress],
            });
            whale = await hardhat_1.ethers.getSigner(whaleAddress);
            fromtokencontract = new hardhat_1.ethers.Contract(tokenAAddr, IERC20_ABI, deployer);
            fromTokenContract = await hardhat_1.ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", tokenAAddr, whale);
            transferAmount = (tokenAName == "WBTC" || tokenBName == "WBTC") ? hardhat_1.ethers.parseUnits("0.005", decA) : hardhat_1.ethers.parseUnits(inputAmount, decA);
            await fromTokenContract.transfer(await deployer.getAddress(), transferAmount);
            await fromTokenContract.transfer(flashloan.getAddress(), transferAmount);
        }
    });
    async function getResPrice(_contract, _decA, _decB) {
        const reserves = await _contract.getReserves();
        const reserveTokenA = BigInt(reserves[1].toString());
        const reserveTokenB = BigInt(reserves[0].toString());
        const bnReserveA = new bignumber_js_1.default(reserveTokenA.toString());
        const bnReserveB = new bignumber_js_1.default(reserveTokenB.toString());
        const bnPriceA = bnReserveB.dividedBy(bnReserveA);
        const bnPriceB = bnReserveA.dividedBy(bnReserveB);
        return { bnReserveA, bnReserveB, bnPriceA, bnPriceB };
    }
    it("should execute arbitrage successfully", async function () {
        //for(let i=0; i<trades2.length; i++) {
        async function listenForReserveChanges(poolContract) {
            poolContract.on('Sync', (reserve0, reserve1) => {
                console.log(`Sync Event: New Reserves - Reserve0: ${hardhat_1.ethers.formatUnits(reserve0, decA)}, Reserve1: ${hardhat_1.ethers.formatUnits(reserve1, decB)}`);
            });
        }
        for (let i = 0; i < 1; i++) {
            const poolContract = new hardhat_1.ethers.Contract(trades2_json_1.default[i].dexs.pool[1], uniswapV2PairABI, provider);
            await listenForReserveChanges(poolContract);
            tokenAName = trades2_json_1.default[i].tokens.name[0];
            tokenBName = trades2_json_1.default[i].tokens.name[1];
            tokenAAddr = trades2_json_1.default[i].tokens.address[0];
            tokenBAddr = trades2_json_1.default[i].tokens.address[1];
            decA = tokens_1.tokens[tokenAName].decimals;
            decB = tokens_1.tokens[tokenBName].decimals;
            const beforeResPrices = await getResPrice(poolContract, decA, decB);
            console.log("--------");
            console.log("Before trade reserves and prices: ");
            console.log(`${tokenAName} reserves: ${hardhat_1.ethers.formatUnits(beforeResPrices.bnReserveA.toFixed(), decA)}`);
            console.log(`${tokenBName} reserves: ${hardhat_1.ethers.formatUnits(beforeResPrices.bnReserveB.toFixed(), decB)}`);
            console.log("Token A price: ", beforeResPrices.bnPriceA.toFixed());
            console.log("Token B price: ", beforeResPrices.bnPriceB.toFixed());
            console.log("--------");
            const amount = (tokenAName == "WBTC" || tokenBName == "WBTC") ? "0.005" : inputAmount;
            const amountIn = hardhat_1.ethers.parseUnits(amount, decA);
            const _swapAddr = [tokenAAddr, tokenBAddr, tokenAAddr];
            const _routerAddr = trades2_json_1.default[i].dexs.router;
            await fromTokenContract.approve(flashloan.getAddress(), amountIn);
            console.log("--- trade size: --- ", amountIn);
            //const currentBlock1 = await ethers.provider.getBlockNumber();
            //console.log("Current Block:", currentBlock1);
            async function mineMultipleBlocks(hardhatProvider, numberOfBlocks) {
                for (let i = 0; i < numberOfBlocks; i++) {
                    await hardhatProvider.send("evm_mine");
                }
            }
            const tx = await flashloan.connect(deployer).executeFlashLoan(tokenAAddr, amountIn, _swapAddr, _routerAddr, { gasLimit: 10000000 });
            await tx.wait();
            //for(let x=0;x<10;x++) {
            //    await network.provider.send("hardhat_mine");
            //}
            await hardhat_1.network.provider.send("hardhat_mine", ["0x100"]); // Mine 256 blocks
            //console.log(tx);
            //const currentBlock2 = await ethers.provider.getBlockNumber();
            //console.log("Current Block:", currentBlock2);
            const updatedResPrices = await getResPrice(poolContract, decA, decB);
            console.log("--------");
            console.log("After trade reserves and prices: ");
            console.log(`${tokenAName} reservess: ${hardhat_1.ethers.formatUnits(updatedResPrices.bnReserveA.toFixed(0), decA)}`);
            console.log(`${tokenBName} reserves: ${hardhat_1.ethers.formatUnits(updatedResPrices.bnReserveB.toFixed(0), decB)}`);
            console.log("Token A price: ", updatedResPrices.bnPriceA.toFixed());
            console.log("Token B price: ", updatedResPrices.bnPriceB.toFixed());
            console.log("--------");
            console.log("Pool:", trades2_json_1.default[i].pool);
            console.log("Token A:", tokenAName);
            console.log("Token B:", tokenBName);
            console.log(`Swap1: ${tokenAName}/${tokenBName}, Swap2: ${tokenBName}/${tokenAName}`);
            console.log("Dex Combo: ", trades2_json_1.default[i].dexs.name);
            console.log(`Amount in: ${hardhat_1.ethers.formatUnits(amountIn, decA)} ${tokenAName}`);
        }
    });
});
