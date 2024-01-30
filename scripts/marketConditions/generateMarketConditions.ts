import { ethers } from 'ethers';
import { pools } from '../../data/pools';
import trades from "../../data/trades/trades2.json"
import { tokens } from '../../data/tokens';
import { generateMarketCombinationsToFile } from './marketConditions';
import { calcResRanges } from './resRanges';

async function createJson() {
    for(let trade of trades) {
        const tokenA: string = trade.tokens.name[0];
        const tokenB: string = trade.tokens.name[1];
        const tokenADec: number = tokens[tokenA].decimals;
        const tokenBDec: number = tokens[tokenB].decimals;
        const poolAddr: string = trade.dexs.pool[0];
        const step = 1;
        let tokenAIndex = 0;
        let tokenBIndex = 1;
        let _tokenAReserveRange, _tokenBReserveRange, _reserveAInt, _reserveBInt
        
        if(trade.reverse == true) {
            tokenAIndex = 1;
            tokenBIndex = 0;
            const { tokenAReserveRange, tokenBReserveRange, reserveAInt, reserveBInt } = await calcResRanges(
                poolAddr,tokenADec,tokenBDec,step,tokenAIndex,tokenBIndex);
            _tokenAReserveRange = tokenAReserveRange;
            _tokenBReserveRange = tokenBReserveRange;
            _reserveAInt = reserveAInt;
            _reserveBInt = reserveBInt;
        } else {
            const { tokenAReserveRange, tokenBReserveRange, reserveAInt, reserveBInt } = await calcResRanges(
                poolAddr,tokenADec,tokenBDec,step,tokenAIndex,tokenBIndex);
            _tokenAReserveRange = tokenAReserveRange;
            _tokenBReserveRange = tokenBReserveRange;
            _reserveAInt = reserveAInt;
            _reserveBInt = reserveBInt;
        }

        console.log("-----------------------")
        console.log("pool: ", trade.pool);
        console.log(`current res ${tokenA}: ${_reserveAInt}`);
        console.log(`current res ${tokenB}: ${_reserveBInt}`);
        console.log(`${tokenA} res range: `, _tokenAReserveRange);
        console.log(`${tokenB} res range: `, _tokenBReserveRange);
        console.log("-----------------------")

    }
}

createJson();