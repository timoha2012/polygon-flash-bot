import { ethers } from "hardhat";
import trades2 from "../../data/trades/trades2.json";
import BigNumber from "bignumber.js";

const uniswapV2PairABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'
];

export async function convertMaticToToken(
    tokenA: string, 
    maticAmount: BigNumber, // Amount in MATIC
    provider: any
): Promise<BigNumber | null> {
  if (tokenA.toUpperCase() === "MATIC") {
    return maticAmount;
  }
  const tokenB = "MATIC";
  for (const trade of trades2) {
      if (trade.tokens.name.includes(tokenA) && trade.tokens.name.includes(tokenB)) {
          // Directly reference the pool address for the token pair
          const poolAddress = trade.dexs.pool[0]; // Assuming the first pool is the correct one
          const poolContract = new ethers.Contract(poolAddress, uniswapV2PairABI, provider);

          try {
              const [reserve0, reserve1] = await poolContract.getReserves();
              let exchangeRate;
              
              if (trade.tokens.name[0] === tokenB) { // If MATIC is reserve0
                  exchangeRate = new BigNumber(reserve1.toString()).div(new BigNumber(reserve0.toString()));
              } else { // If MATIC is reserve1
                  exchangeRate = new BigNumber(reserve0.toString()).div(new BigNumber(reserve1.toString()));
              }

              const tokenAAmount = maticAmount.multipliedBy(exchangeRate);
              return tokenAAmount;
          } catch (error) {
              console.error('Error converting MATIC to Token:', error);
              return null;
          }
      }
  }

  //console.log("Pool not found for specified token pair.");
  return null;
}


  const provider = new ethers.JsonRpcProvider("https://polygon-mainnet.g.alchemy.com/v2/MGBhU6nCDGDQdIt8OrvzBxxfgQlt1BXs");
  const tokenA = "WETH";
  const tokenB = "MATIC";
  const maticAmount = new BigNumber(ethers.parseUnits("1", "ether").toString()); // 1 MATIC
  
  convertMaticToToken(tokenA, maticAmount, provider)
    .then(amount => {
      if (amount !== null) {
        //console.log(`Amount of ${tokenA} for 1 MATIC:`, amount.toString()); // Assuming Token A also uses 18 decimal places
      }
    });
