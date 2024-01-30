import BigNumber from "bignumber.js";

export function calcRevenue(priceBPool1:any,priceBPool2:any,tradeSizeTokenB:any) {
    const priceDifference = priceBPool2.minus(priceBPool1);
    const potentialRevenue = priceDifference.multipliedBy(tradeSizeTokenB);
    return potentialRevenue;
}

export function calcTotalCosts(
    tradeSize: number, 
    poolFeePercent: number, 
    slippagePerc: number, 
    gasCost: number
): number {
    const poolFeeCost = tradeSize * (poolFeePercent / 100);
    const slippageCost = tradeSize * (slippagePerc / 100);
    const totalTradeCost = poolFeeCost + slippageCost + gasCost;
    return totalTradeCost;
}

export async function getResPrice(_contract: any , _decA: number, _decB: number) {
    const reserves = await _contract.getReserves();
    const reserveTokenA = BigInt(reserves[0].toString());
    const reserveTokenB = BigInt(reserves[1].toString());
    const bnReserveA = new BigNumber(reserveTokenA.toString());
    const bnReserveB = new BigNumber(reserveTokenB.toString());  
    const bnPriceA: BigNumber = bnReserveB.dividedBy(bnReserveA);
    const bnPriceB: BigNumber = bnReserveA.dividedBy(bnReserveB);
    return { bnReserveA, bnReserveB, bnPriceA, bnPriceB };
}

export function calcNewRes(resA: BigNumber, resB: BigNumber, tradeSize: any) {
    const bnTradeSize = new BigNumber(tradeSize);
    const k = resA.times(resB);
    const newReserveA = resA.plus(bnTradeSize);
    const newReserveB = k.dividedBy(newReserveA);
    const newPriceA = newReserveB.dividedBy(newReserveA);
    const newPriceB = newReserveA.dividedBy(newReserveB);
    return { newReserveA, newReserveB, newPriceA, newPriceB };
}

export function calcTradeSize(reserveAmount: any, percentage: any) {
    const decimalPercentage = percentage / 100;
    const tradeSize = reserveAmount * decimalPercentage;
    return tradeSize;
}

export function calcMinGap(totalCostsWETH: BigNumber, tradeSizeTokenB: BigNumber, refPrice: any): {minGap: BigNumber, minGapPerc: number} {
    if(tradeSizeTokenB.isEqualTo(0)) {
        throw new Error("Trade size of Token B cannot be zero.");
    }

    const minGap = totalCostsWETH.dividedBy(tradeSizeTokenB);
    let minGapPerc: any = minGap.dividedBy(refPrice).multipliedBy(100);
    minGapPerc = minGapPerc.toNumber();
    return {minGap, minGapPerc};
}

export function calcOptimalTradeSize(
    expSlippage: number, // pre calculated from res grid
    gapPerc: number,
    gasCostTokenA: BigNumber,
    pool1ResB: BigNumber,
    riskTolerance: number, 
    maxTradeSize: BigNumber, 
    minProfitMargin: number 
): BigNumber {
    let tradeSize1 = pool1ResB.multipliedBy(gapPerc / 100).multipliedBy(riskTolerance / 100);
    tradeSize1 = BigNumber.min(tradeSize1, maxTradeSize);
    const totalTradeCost = gasCostTokenA.plus(tradeSize1.multipliedBy(0.006));
    let tradeSize2 = tradeSize1.minus(totalTradeCost);
    const expectedSlippage = tradeSize2.multipliedBy(expSlippage); // Slippage 1%
    tradeSize2 = tradeSize2.minus(expectedSlippage);
    let tradeSize3 = tradeSize2.multipliedBy(1 - minProfitMargin / 100);
    tradeSize3 = BigNumber.max(tradeSize3, new BigNumber(0));
    tradeSize3 = BigNumber.min(tradeSize3, maxTradeSize);
    return tradeSize3;
}
