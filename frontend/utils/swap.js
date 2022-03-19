import { Contract } from "ethers";
import { EXCHANGE_CONTRACT_ADDRESS,
	EXCHANGE_CONTRACT_ABI,
	TOKEN_CONTRACT_ADDRESS,
	TOKEN_CONTRACT_ABI } from "../constants/index";

//returns the number of Eth/CD Tokens that can be received when the user swaps "_swapAmountWei" amount of Eth/CD Tokens
export const getAmountofTokensReceivedFromSwap = async (
	_swapAmountWei,
	provider,
	ethSelected,
	ethBalance,
	reservedCD
) => {
	const exchangeContract = new Contract(
		EXCHANGE_CONTRACT_ADDRESS,
		EXCHANGE_CONTRACT_ABI,
		provider
	)
	let amountofTokens;
	if (ethSelected) {
		  // If ETH is selected this means our input value is `Eth` which means our input amount would be
  // `_swapAmountWei`, the input reserve would be the `ethBalance` of the contract and output reserve
  // would be the  `Crypto Dev token` reserve
		amountofTokens = await exchangeContract.getAmountOfTokens(
			_swapAmountWei,
			ethBalance,
			reservedCD
		)
	} else {
		    // If ETH is not selected this means our input value is `Crypto Dev` tokens which means our input amount would be
    // `_swapAmountWei`, the input reserve would be the `Crypto Dev token` reserve of the contract and output reserve
    // would be the `ethBalance`
		amountofTokens = await exchangeContract.getAmountOfTokens(
			_swapAmountWei,
			reservedCD,
			ethBalance
		)
	}
	return amountofTokens;
}

// Swaps  `swapAmountWei` of Eth/Crypto Dev tokens with `tokenToBeRecievedAfterSwap` amount of Eth/Crypto Dev tokens.
export const swapTokens = async (
	signer,
	swapAmountWei,
	tokenToBeRecievedAfterSwap,
	ethSelected
) => {

	const exchangeContract = new Contract(
		EXCHANGE_CONTRACT_ADDRESS,
		EXCHANGE_CONTRACT_ABI,
		signer
		)
	const tokenContract = new Contract(
		TOKEN_CONTRACT_ADDRESS,
		TOKEN_CONTRACT_ABI,
		signer
		)
		let tx;
		if (ethSelected) {
			// the value is the ether we are paying to the contract
			tx = await exchangeContract.ethToCDToken(
				tokenToBeRecievedAfterSwap,
				{
					value: swapAmountWei,
				}
			);
		} else {
			// ERC20 approval
			tx = await tokenContract.approve(
				EXCHANGE_CONTRACT_ADDRESS,
				swapAmountWei.toString()
			)
			await tx.wait();
			// CDTokenToEth takes in `swapAmountWei` of CDT and send back `tokenToBeReceivedAfterSwap` amount of ether to the user
			tx = await exchangeContract.CDTokenToEth(
				swapAmountWei,
				tokenToBeRecievedAfterSwap
			)
		}
		await tx.wait();
}
