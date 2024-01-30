// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import { IERC20 as BalancerIERC20 } from "@balancer-labs/v2-interfaces/contracts/vault/IVault.sol"; 


contract swapTest {
    // Event to log the successful swap
    event SwapExecuted(uint256 amountOut);

    address owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function swap(
        address routerAddr,
        address fromToken,
        address toToken, 
        uint256 amount
    ) public {
        IERC20 fromTokenContract = IERC20(fromToken);
        fromTokenContract.transferFrom(msg.sender, address(this), amount);

        require(fromTokenContract.approve(routerAddr, amount), 'Token transfer not approved.');

        address[] memory path = new address[](2);
        path[0] = fromToken;
        path[1] = toToken;

        IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(routerAddr);
        uint[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            amount, 
            0, 
            path, 
            address(this), 
            block.timestamp
        );

        uint256 amountOut = amounts[amounts.length - 1];
        emit SwapExecuted(amountOut);
    }

    function swap2(
        address _routerAddr,
        address _fromToken,
        address _toToken, 
        uint256 _amount
        ) external {
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

        //return amounts[amounts.length - 1];
    }

}
