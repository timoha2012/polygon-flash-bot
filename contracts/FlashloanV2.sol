// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0 <0.9.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { IERC20 as BalancerIERC20, IFlashLoanRecipient, IVault } from "@balancer-labs/v2-interfaces/contracts/vault/IVault.sol"; 
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol"; // swap router v2#import "@typechain/hardhat";

contract FlashloanV2 is IFlashLoanRecipient {
    using SafeMath for uint256;

    address internal constant vaultAddr = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;
    address[] internal swapAddr;
    address[] internal routerAddr;

    uint256 internal swapAmountOut;
    uint256 internal flashLoanAmount;

    IVault private constant vault = IVault(vaultAddr);

    function swap(
        address _routerAddr,
        address _fromToken,
        address _toToken, 
        uint256 _amount
        ) internal {
        BalancerIERC20 fromtoken = BalancerIERC20(_fromToken);
        uint256 contractBalance = fromtoken.balanceOf(address(this));
        require(contractBalance >= _amount, "Insufficient token balance for swap");


        IUniswapV2Router02 v2SwapRouter = IUniswapV2Router02(_routerAddr);
        BalancerIERC20 fromToken = BalancerIERC20(_fromToken);
        require(fromToken.approve(address(_routerAddr), _amount), 'v2 token transfer not approved.');

        address[] memory path = new address[](2);
        path[0] = address(_fromToken);
        path[1] = address(_toToken);

        require(path.length == 2, "Invalid swap path length");
        require(path[0] == _fromToken && path[1] == _toToken, "Invalid swap path");
        for (uint i = 0; i < path.length; i++) {
        require(path[i] != address(0), "Zero address in swap path");
        }

        uint[] memory amounts = v2SwapRouter.swapExactTokensForTokens(_amount, 0, path, address(this), block.timestamp);

        uint256 minExpectedAmount = 0;
        uint256 amountReceived = amounts[amounts.length - 1];
        require(amountReceived > minExpectedAmount, "Received amount less than expected");

        swapAmountOut = amounts[amounts.length - 1];
    }

    function arbitrage(
        uint256 _flAmount
        ) internal {
        BalancerIERC20 fromToken = BalancerIERC20(swapAddr[0]);
        uint256 contractBalance = fromToken.balanceOf(address(this));
        console.log("Contract balance of fromToken: ", contractBalance);

        require(contractBalance >= _flAmount, "Insufficient tokens in contract balance");        

        uint256 amount;

        for(uint256 i=0;i<routerAddr.length;i++) { // iterate through the router address array
            if(i==0) amount = _flAmount; // if first swap set amount to the flashloaned amount
            else amount = swapAmountOut; // if second swap set amount to the first swap's amount out

            swap(routerAddr[i], swapAddr[i], swapAddr[i+1], amount);
            console.log(i, swapAmountOut);
        }
        
    }        

    function executeFlashLoan(
        address _flTokenAddr,
        uint256 _flAmount,
        address[] calldata _swapAddr,
        address[] calldata _routerAddr
        ) external {
        BalancerIERC20 flToken = BalancerIERC20(_flTokenAddr); 
        BalancerIERC20[] memory flTokens = new BalancerIERC20[](1);
        uint256[] memory flAmounts = new uint256[](1); 
        flTokens[0] = flToken;
        flAmounts[0] = _flAmount ;
        swapAddr = _swapAddr;
        routerAddr = _routerAddr;
        vault.flashLoan(this,flTokens,flAmounts,"");
    }

    // called after this contract has received the flash loaned amount
    function receiveFlashLoan(
        BalancerIERC20[] memory tokens,
        uint256[] memory amounts,
        uint256[] memory feeAmounts,
        bytes memory userData
    ) external override {
        userData; //do nothing -- clear warning
        console.log("Token amount from Flashloan: ", amounts[0]);
        arbitrage(amounts[0]); // initiates arbitrage logic

        // pay back loan amount to the vault contract
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 amountOwing = amounts[i].add(feeAmounts[i]);
            BalancerIERC20(tokens[i]).transfer(vaultAddr, amountOwing);
        }
    }
}
