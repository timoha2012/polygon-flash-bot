// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0 <0.9.0;

// Importing necessary libraries and contracts
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { IERC20 as BalancerIERC20, IFlashLoanRecipient, IVault } from "@balancer-labs/v2-interfaces/contracts/vault/IVault.sol"; 
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol"; 

// Inheritance from Balancer's IFlashLoanRecipient interface 
contract FlashloanV2 is IFlashLoanRecipient {
    using SafeMath for uint256; // SafeMath library to prevent integer overflows

    // Constants and state variables
    address internal constant vaultAddr = 0xBA12222222228d8Ba445958a75a0704d566BF2C8; // Balancer Vault address
    address[] internal swapAddr; // Addresses for swapping tokens
    address[] internal routerAddr; // Addresses of Uniswap V2 routers for swapping

    uint256 internal swapAmountOut; // Amount of token received from swap
    uint256 internal flashLoanAmount; // Amount of token for flash loan

    IVault private constant vault = IVault(vaultAddr); // Instance of Balancer Vault

    // Function to perform token swap using Uniswap V2 Router
    function swap(
        address _routerAddr,
        address _fromToken,
        address _toToken, 
        uint256 _amount
        ) internal {
        BalancerIERC20 fromtoken = BalancerIERC20(_fromToken);
        uint256 contractBalance = fromtoken.balanceOf(address(this));
        require(contractBalance >= _amount, "Insufficient token balance for swap");

        // Initiating swap on Uniswap V2
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

        // Executing the swap
        uint[] memory amounts = v2SwapRouter.swapExactTokensForTokens(_amount, 0, path, address(this), block.timestamp);
        uint256 amountReceived = amounts[amounts.length - 1];
        require(amountReceived > 0, "Received amount less than expected");

        swapAmountOut = amountReceived;
    }

    // Function to execute arbitrage logic
    function arbitrage(
        uint256 _flAmount
        ) internal {
        BalancerIERC20 fromToken = BalancerIERC20(swapAddr[0]);
        uint256 contractBalance = fromToken.balanceOf(address(this));
        console.log("Contract balance of fromToken: ", contractBalance);

        require(contractBalance >= _flAmount, "Insufficient tokens in contract balance");        

        uint256 amount;

        // Performing swaps based on the router and token addresses
        for(uint256 i=0;i<routerAddr.length;i++) { 
            amount = i == 0 ? _flAmount : swapAmountOut;
            swap(routerAddr[i], swapAddr[i], swapAddr[i+1], amount);
            console.log(i, swapAmountOut);
        }
    }        

    // Function to initiate a flash loan
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
        flAmounts[0] = _flAmount;
        swapAddr = _swapAddr;
        routerAddr = _routerAddr;
        vault.flashLoan(this, flTokens, flAmounts, "");
    }

    // Callback function for receiving the flash loan
    function receiveFlash
