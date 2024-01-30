import { tokens } from "./tokens";

interface TokenInfo {
  name: string;
  address: string;
  decimals: number;
}

interface DexInfo {
  name: string;
  router: string;
  pool: string;
}

interface PoolInfo {
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  dex: DexInfo[];
}

interface Pools {
  [key: string]: PoolInfo;
}

export const pools: Pools = {
    "MATIC-WETH": {
      tokenA: { name: tokens.MATIC.name, address: tokens.MATIC.address, decimals: tokens.MATIC.decimals },
      tokenB: { name: tokens.WETH.name, address: tokens.WETH.address, decimals: tokens.WETH.decimals },
      dex: [
        { name: "Sushiswap", router: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", pool: "0xc4e595acDD7d12feC385E5dA5D43160e8A0bAC0E" },
        { name: "Quickswap", router: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", pool: "0xadbF1854e5883eB8aa7BAf50705338739e558E5b" },
      ]
    },
    "WBTC-WETH": {
      tokenA: { name: tokens.WBTC.name, address: tokens.WBTC.address, decimals: tokens.WBTC.decimals },
      tokenB: { name: tokens.WETH.name, address: tokens.WETH.address, decimals: tokens.WETH.decimals },
      dex: [
        { name: "Sushiswap", router: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", pool: "0xE62Ec2e799305E0D367b0Cc3ee2CdA135bF89816" },
        { name: "Quickswap", router: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", pool: "0xdC9232E2Df177d7a12FdFf6EcBAb114E2231198D" },
      ]
    },
    "USDCe-WETH": {
      tokenA: { name: tokens.USDCe.name, address: tokens.USDCe.address, decimals: tokens.USDCe.decimals },
      tokenB: { name: tokens.WETH.name, address: tokens.WETH.address, decimals: tokens.WETH.decimals },
      dex: [
        { name: "Sushiswap", router: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", pool: "0x34965ba0ac2451A34a0471F04CCa3F990b8dea27" },
        { name: "Quickswap", router: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", pool: "0x853Ee4b2A13f8a742d64C8F088bE7bA2131f670d" },
      ]
    },
    "MATIC-USDCe": {
      tokenA: { name: tokens.MATIC.name, address: tokens.MATIC.address, decimals: tokens.MATIC.decimals },
      tokenB: { name: tokens.USDCe.name, address: tokens.USDCe.address, decimals: tokens.USDCe.decimals },
      dex: [
        { name: "Sushiswap", router: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", pool: "0xcd353F79d9FADe311fC3119B841e1f456b54e858" },
        { name: "Quickswap", router: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", pool: "0x6e7a5FAFcec6BB1e78bAE2A1F0B612012BF14827" },
      ]
    },
    "WBTC-USDCe": {
      tokenA: { name: tokens.WBTC.name, address: tokens.WBTC.address, decimals: tokens.WBTC.decimals },
      tokenB: { name: tokens.USDCe.name, address: tokens.USDCe.address, decimals: tokens.USDCe.decimals },
      dex: [
        { name: "Sushiswap", router: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", pool: "0xD02b870c556480491c70AaF98C297fddd93F6f5C" },
        { name: "Quickswap", router: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", pool: "0xF6a637525402643B0654a54bEAd2Cb9A83C8B498" },
      ]
    },
    "MATIC-WBTC": {
      tokenA: { name: tokens.MATIC.name, address: tokens.MATIC.address, decimals: tokens.MATIC.decimals },
      tokenB: { name: tokens.WBTC.name, address: tokens.WBTC.address, decimals: tokens.WBTC.decimals },
      dex: [
        { name: "Sushiswap", router: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", pool: "0x8531c4e29491fE6e5e87AF6054FC20FcCf0b4290" },
        { name: "Quickswap", router: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", pool: "0xf6B87181BF250af082272E3f448eC3238746Ce3D" },
      ]
    },
  };
  