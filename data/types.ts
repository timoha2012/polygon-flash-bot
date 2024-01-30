export type TokenDetails = {
  name: string;
  address: string;
  decimals: number;
};

export type TokenInfo = {
  [key: string]: TokenDetails;
};


export type PoolInfo = {
  tokenA: string;
  tokenB: string;
  dexes: DEXInfo[];
};
  
export type DEXInfo = {
  name: string;
  router: string;
  pool: string;
};

type DEX = { router: string; };

export type DEXMap = { [key: string]: DEX; };

export type PoolMap = { [key: string]: PoolInfo; };