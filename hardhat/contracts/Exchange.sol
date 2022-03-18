// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Exchange is ERC20 {

	address public cryptoDevTokenAddress;

	// Exchange is inheriting ERC20, because our exchange would keep track of Crypto Dev LP Tokens
	constructor(address _CryptoDevToken) ERC20("Crypto Dev LP Token", "CDLP") {
		require(_CryptoDevToken != address(0), "Token address passed is a null address");
		cryptoDevTokenAddress = _CryptoDevToken;
	}

	// @dev returns the amount of crypto dev tokens held by the contract
	function getReserve() public view returns (uint) {
		return ERC20(cryptoDevTokenAddress).balanceOf(address(this));
	}

	// @dev Adds Liquidity to the exchange
	function addLiquidity(uint _amount) public payable returns (uint) {
		uint liquidity;
		uint ethBalance = address(this).balance;
		uint cryptoDevTokenReserve = getReserve();
		ERC20 cryptoDevToken = ERC20(cryptoDevTokenAddress);

		// If the reserve is empty intake any user supplied value for "ether" and "crypto dev" tokens because there is no ratio currently
		if(cryptoDevTokenReserve == 0) {
			// transfer the cryptoDevToken from the user's account to the contract
			cryptoDevToken.transferFrom(msg.sender, address(this), _amount);
			// take the current ethBalance and mint `ethBalance` amount of LP tokens to the user
			// `liquidity` provided is equal to `ethBalance`
			// this is the first time user adding eth to the contract,
			// so whatever eth contract has is equal to the one supplied by the user in the current addLiquidity call
			// liquidity tokens that need to be minted to the user on addLiquidity callshould always be proportional to the eth specified by the user
			liquidity = ethBalance;
			_mint(msg.sender, liquidity);
		} else {
			    //  If the reserve is not empty, intake any user supplied value for
                // `Ether` and determine according to the ratio how many `Crypto Dev` tokens
                // need to be supplied to prevent any large price impacts because of the additional
                // liquidity

				// EthReserve should be the current ethBalance subtracted by the value of ether sent by the user
            // in the current `addLiquidity` call
			uint ethReserve = ethBalance - msg.value;

			      // Ratio should always be maintained so that there are no major price impacts when adding liquidity
				  // Ratio here is -> (cryptoDevTokenAmount user can add/cryptoDevTokenReserve in the contract) = (Eth Sent by the user/Eth Reserve in the contract);
				  // So doing some maths, (cryptoDevTokenAmount user can add) = (Eth Sent by the user * cryptoDevTokenReserve /Eth Reserve);
			uint cryptoDevTokenAmount = (msg.value * cryptoDevTokenReserve)/(ethReserve);
			require(_amount >= cryptoDevTokenAmount, "Amount of tokens sent is less than the minimum tokens required");
			// transfer only (cryptoDevTokenAmount user can add) amount of `Crypto Dev tokens` from users account to the contract
			cryptoDevToken.transferFrom(msg.sender, address(this), cryptoDevTokenAmount);

			// The amount of LP tokens that would be sent to the user should be propotional to the liquidity of ether added by the user
			// Ratio to be maintained is
			// (lp tokens to be sent to the user(liquidity)/ totalSupply of LP tokens in contract) = (eth sent by the user)/(eth reserve in the contract)
            // by some maths -> liquidity =  (totalSupply of LP tokens in contract * (eth sent by the user))/(eth reserve in the contract)
			liquidity = (totalSupply() * msg.value)/ ethReserve;
			_mint(msg.sender, liquidity);
		}
		return liquidity;
	}

	// @dev returns the amount eth/crypto dev token that would be returned to the user in the swap
	function removeLiquidity(uint _amount) public returns (uint, uint) {
		require(_amount > 0, "Amount should be greater than zero");
		uint ethReserve = address(this).balance;
		uint _totalSupply = totalSupply();
		// the amount of Eth that would be sent back to the user is based on ratio
		// Eth sent back to the user / current eth reserve = (amount of LP tokens that user want to withdraw)/ total supply of LP tokens
		uint ethAmount = (ethReserve * _amount) / _totalSupply;
		// the amount of CD token that would be sent back to the user is based on ratio
		// CD sent back to the user / current CD token reserve = (amount of LP tokens that user want to withdraw) / total supply of LP tokens
		uint cryptoDevTokenAmount = (getReserve() * _amount) / _totalSupply;
		// burn the sent LP tokens from the user's wallet because they are already sent to remove liquidity
		_burn(msg.sender, _amount);
		// transfer ethAmount  from the user wallet to the contrat
		payable(msg.sender).transfer(ethAmount);
		// transfer cryptoDevTokenAmount from the user wallet to the contract
		ERC20(cryptoDevTokenAddress).transfer(msg.sender, cryptoDevTokenAmount);
		return (ethAmount, cryptoDevTokenAmount);
	}

	// @dev returns the amount Eth/CD token that would be returned to the user in the swap
	function getAmountOfTokens(
	uint256 inputAmount,
	uint256 inputReserve,
	uint256 outputReserve
	) public pure returns (uint256) {
		require(inputReserve > 0 && outputReserve > 0, "Invalid Reserves");
		uint256 inputAmountWithFee = inputAmount * 99;
		// XY = K ==> (x + ∆x) * (y - ∆y) = xy => ∆y = (y*∆x)/(x + ∆x)
		// ∆x == inputAmountWithFee || x == inputReserve || y == outputReserve || ∆y == getAmoutOfTokens
		uint256 numerator = inputAmountWithFee * outputReserve;
		uint256 denominator = (inputReserve * 100) + inputAmountWithFee;
		return numerator / denominator;
	}

	// @dev swap ether for CryptoDev token
	function ethToCDToken(uint _minTokens) public payable {
		uint256 tokenReserve = getReserve();
		// call the getAmountOfTokens of CDT that would be returned into the user after the swap
		// actual inputReserve is address(this).balance - msg.value
		uint256 tokensBought = getAmountOfTokens(
			msg.value,
			address(this).balance - msg.value,
			tokenReserve
		);
		require(tokensBought >= _minTokens, "insufficient output amount");
		// transfer CDT to the user
		ERC20(cryptoDevTokenAddress).transfer(msg.sender, tokensBought);
	}

	// @dev swap CDT for ether
	function CDTokenToEth(uint _tokensSold, uint _minEth) public {
		uint256 tokenReserve = getReserve();
		uint256 ethBought = getAmountOfTokens(
			_tokensSold,
			tokenReserve,
			address(this).balance
		);
		require(ethBought >= _minEth, "insufficient output amount");
		// Transfer CDT from the user to the contract
		ERC20(cryptoDevTokenAddress).transferFrom(
			msg.sender,
			address(this),
			_tokensSold
		);
		payable(msg.sender).transfer(ethBought);
	}
}
