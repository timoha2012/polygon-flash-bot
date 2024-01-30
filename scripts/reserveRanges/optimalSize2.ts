import resGrid from "../../reserveGrid.json";
import { ethers } from 'ethers';
import BigNumber from "bignumber.js";

const resA = resGrid[0][0];
const resB = resGrid[0][1];
const resABn = new BigNumber(resA);
const resBBn = new BigNumber(resB);

//console.log(resABn.toFixed(),resBBn.toFixed());

async function calcSlippage(tradeSize: BigNumber) {
    const k = resABn.multipliedBy(resBBn);

    const bnInitPriceA = resBBn.dividedBy(tradeSize);
    const bnInitPriceB = resABn.dividedBy(resBBn);

    const newBnReserveA = resABn.plus(resBBn);
    const newBnReserveB = k.dividedBy(newBnReserveA);

    const bnNewPriceA = newBnReserveB.dividedBy(newBnReserveA);
    const bnNewPriceB = newBnReserveA.dividedBy(newBnReserveB);

    let slippagePerc: any = bnNewPriceB.minus(bnInitPriceB).dividedBy(bnInitPriceB).multipliedBy(100);

    return slippagePerc;
}

async function optTrade() {
    
}
