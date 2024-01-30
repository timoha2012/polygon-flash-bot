import { ethers } from "ethers";
import { slippageFeeCalcV2 } from "./slippageFeeCalc";

const v2Fee = 3000;

async function profitCalc(_opp: string[]) {  // opp = ["pool", "router1", "router2", "fee"]  // array of addresses
    let tradeAmount: number;
    let maxLoanAmount: number;
    const pool: string = _opp[0];
    const router1: string = _opp[1];
    const router2: string = _opp[2];
    
    

}