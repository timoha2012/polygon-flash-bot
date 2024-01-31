// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Importing necessary interfaces
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import { IERC20 as BalancerIERC20 } from "@balancer-labs/v2-interfaces/contracts/vault/IVault.sol"; 

// Main contract
contract swapTest {
    // Event to log the successful swap
    event SwapExecuted(uint256 amountOut);

    address owner; // Variable to store the owner's address

    // Modifier to restrict function access to only the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not owner");
        _;
    }

    // Constructor to set the contract deployer as the owner
    constructor() {
        owner = msg.sender;
    }

    // Function to swap tokens using Uniswap V2
    function swap(
        address routerAddr,
        address fromToken,
        address toToken, 
        uint256 amount
    ) public {
        IERC20 fromTokenContract = IERC20(fromToken);
        fromTokenContract.transferFrom(msg.sender, address(this), amount); // Transferring tokens to the contract

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
        emit SwapExecuted(amountOut); // Emitting an event after successful swap
    }

    // Function to swap tokens (Alternate version)
    function swap2(
        address _routerAddr,
        address _fromToken,
        address _toToken, 
        uint256 _amount
        ) external {
        BalancerIERC20 fromtoken = BalancerIERC20(_fromToken);
        uint256 contractBalance = fromtoken.balanceOf(address(this)); // Checking contract balance
        require(contractBalance >= _amount, "Insufficient token balance for swap");

        IUniswapV2Router02 v2SwapRouter = IUniswapV2Router02(_routerAddr);
        BalancerIERC20 fromToken = BalancerIERC20(_fromToken);
        require(fromToken.approve(address(_routerAddr), _amount), 'v2 token transfer not approved.');

        address[] memory path = new address[](2);
        path[0] = address(_fromToken);
        path[1] = address(_toToken);

        // Validating swap path
        require(path.length == 2, "Invalid swap path length");
        for (uint i = 0; i < path.length; i++) {
            require(path[i] != address(0), "Zero address in swap path");
        }

        uint[] memory amounts = v2SwapRouter.swapExactTokensForTokens(_amount, 0, path, address(this), block.timestamp);

        uint256 minExpectedAmount = 0;
        uint256 amountReceived = amounts[amounts.length - 1];
        require(amountReceived > minExpectedAmount, "Received amount less than expected");

        // The function does not return a value, but it could return the amount received from the swap if needed
    }

}
