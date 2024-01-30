// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.0 <0.9.0;

//pragma abicoder v2; // allow complex types to be encoded/decoded in calldata
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol'; 
import { IERC20 as BalancerIERC20, IFlashLoanRecipient, IVault } from "@balancer-labs/v2-interfaces/contracts/vault/IVault.sol"; 
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol"; // swap router v3
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol"; // swap router v2#import "@typechain/hardhat";

contract Flashloan is IFlashLoanRecipient { // flashloan recipient interface from balancer 
    // prevent over/under flow of arithmatic operations
    using SafeMath for uint256;

    // addresses
    address internal constant vaultAddr = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;
    address internal constant v3RouterAddr = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address[] internal swapAddr;
    address[] internal routerAddr;

    // integers
    uint256 internal swapAmountOut;
    uint256 internal flashLoanAmount;
    uint24 internal swapFee;

    // implement the IBalancerVault interface to interact with the balancer vault contract
    IVault private constant vault = IVault(vaultAddr);

    function swap(
        bool isV3,
        address _routerAddr,
        address _fromToken,
        address _toToken, 
        uint256 _amount,
        uint24 _fee
        ) internal {
        // Check if the contract has enough balance of the fromToken
        BalancerIERC20 fromtoken = BalancerIERC20(_fromToken);
        uint256 contractBalance = fromtoken.balanceOf(address(this));
        require(contractBalance >= _amount, "Insufficient token balance for swap");

        if (isV3) {
            ISwapRouter v3SwapRouter = ISwapRouter(_routerAddr);
            TransferHelper.safeApprove(_fromToken, address(_routerAddr), _amount);
            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({tokenIn: _fromToken,tokenOut: _toToken,fee: _fee,recipient: address(this),deadline: block.timestamp,amountIn: _amount,amountOutMinimum: 0,sqrtPriceLimitX96: 0});
            swapAmountOut = v3SwapRouter.exactInputSingle(params);
            return;
        } else {
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
    }

    function arbitrage(
        uint256 _flAmount
        ) internal {
        // Check the token balance of contract
        BalancerIERC20 fromToken = BalancerIERC20(swapAddr[0]);
        uint256 contractBalance = fromToken.balanceOf(address(this));
        console.log("Contract balance of fromToken: ", contractBalance);

        // Ensure contract has enough tokens to transfer
        require(contractBalance >= _flAmount, "Insufficient tokens in contract balance");        

        bool isV3;
        uint256 amount;

        for(uint256 i=0;i<routerAddr.length;i++) { // iterate through the router address array
            if(routerAddr[i] == v3RouterAddr) isV3 = true;
            else isV3 = false;
            if(i==0) amount = _flAmount; // if first swap set amount to the flashloaned amount
            else amount = swapAmountOut; // if second swap set amount to the first swap's amount out

            swap(isV3, routerAddr[i], swapAddr[i], swapAddr[i+1], amount, swapFee);
            console.log(i, swapAmountOut);
        }
        
    }        

    // initiates flashloan sequence from the vault contract
    function executeFlashLoan(
        address _flTokenAddr,
        uint256 _flAmount,
        address[] calldata _swapAddr,
        address[] calldata _routerAddr,
        uint24 _fee
        ) external {
        BalancerIERC20 flToken = BalancerIERC20(_flTokenAddr); 
        BalancerIERC20[] memory flTokens = new BalancerIERC20[](1);
        uint256[] memory flAmounts = new uint256[](1); 
        flTokens[0] = flToken;
        flAmounts[0] = _flAmount ;
        swapAddr = _swapAddr;
        routerAddr = _routerAddr;
        swapFee = _fee;
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
