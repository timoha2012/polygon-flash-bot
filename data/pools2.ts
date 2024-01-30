interface PoolData {
    token0: string;
    token1: string;
    address: string;
    dex: string;
}

interface Pools {
    [key: string]: PoolData;
}

export const pools2: Pools = {
    "MATIC-WETH-SUSHI": {token0: "MATIC", token1: "WETH", address: "0xc4e595acDD7d12feC385E5dA5D43160e8A0bAC0E", dex: "SUSHI"},
    "MATIC-WETH-QUICK": {token0: "MATIC", token1: "WETH", address: "0xadbF1854e5883eB8aa7BAf50705338739e558E5b", dex: "QUICK"},
    "WBTC-WETH-SUSHI": {token0: "WBTC", token1: "WETH", address: "0xE62Ec2e799305E0D367b0Cc3ee2CdA135bF89816", dex: "SUSHI"},
    "WBTC-WETH-QUICK": {token0: "WBTC", token1: "WETH", address: "0xdC9232E2Df177d7a12FdFf6EcBAb114E2231198D", dex: "QUICK"},
    "USDCe-WETH-SUSHI": {token0: "USDCe", token1: "WETH", address: "0x34965ba0ac2451A34a0471F04CCa3F990b8dea27", dex: "SUSHI"},
    "USDCe-WETH-QUICK": {token0: "USDCe", token1: "WETH", address: "0x853Ee4b2A13f8a742d64C8F088bE7bA2131f670d", dex: "QUICK"},
    "MATIC-USDCe-SUSHI": {token0: "MATIC", token1: "USDCe", address: "0xcd353F79d9FADe311fC3119B841e1f456b54e858", dex: "SUSHI"},
    "MATIC-USDCe-QUICK": {token0: "MATIC", token1: "USDCe", address: "0x6e7a5FAFcec6BB1e78bAE2A1F0B612012BF14827", dex: "QUICK"},
    "WBTC-USDCe-SUSHI": {token0: "WBTC", token1: "USDCe", address: "0xD02b870c556480491c70AaF98C297fddd93F6f5C", dex: "SUSHI"},
    "WBTC-USDCe-QUICK": {token0: "WBTC", token1: "USDCe", address: "0xF6a637525402643B0654a54bEAd2Cb9A83C8B498", dex: "QUICK"},
    "MATIC-WBTC-SUSHI": {token0: "MATIC", token1: "WBTC", address: "0x8531c4e29491fE6e5e87AF6054FC20FcCf0b4290", dex: "SUSHI"},
    "MATIC-WBTC-QUICK": {token0: "MATIC", token1: "WBTC", address: "0xf6B87181BF250af082272E3f448eC3238746Ce3D", dex: "QUICK"},
    
}