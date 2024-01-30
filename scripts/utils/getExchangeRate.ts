import { ethers } from "hardhat";

const uniswapV2PairABI = [
    'function getReserves() external view returns (uint112, uint112, uint32)',
    'event Sync(uint112 reserve0, uint112 reserve1)'
];

export async function getExchangeRate(
    trades: any, 
    tokenA: string, 
    tokenB: string,
    provider: any
  ): Promise<number | null> {
    for (const trade of trades) {
      if (trade.tokens.name.includes(tokenA) && trade.tokens.name.includes(tokenB)) {
        const poolAddress = trade.dexs.pool[trade.tokens.name.indexOf(tokenA)];
        const poolContract = new ethers.Contract(poolAddress, uniswapV2PairABI, provider);
  
        try {
          const [reserve0, reserve1] = await poolContract.getReserves();
          const tokenAIndex = trade.tokens.name.indexOf(tokenA);
          const exchangeRate = tokenAIndex === 0 ? reserve0 / reserve1 : reserve1 / reserve0;
          return exchangeRate;
        } catch (error) {
          console.error('Error fetching exchange rate:', error);
          return null;
        }
      }
    }
  
    console.log("Pool not found for specified token pair.");
    return null;
  }