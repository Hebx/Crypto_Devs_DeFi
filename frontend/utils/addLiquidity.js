import { Contract, utils} from "ethers";
import { EXCHANGE_CONTRACT_ADDRESS,
	EXCHANGE_CONTRACT_ABI,
	TOKEN_CONTRACT_ADDRESS,
	TOKEN_CONTRACT_ABI } from "../constants/index";

// addLiquidity to the exchange if the user is adding initial liquidity, users decide the ether and CD tokens he wants to add to the exchange
// if he is adding after the initial liquidity then we calculate the cd token he can add given the eth he want to add by keeping the ratios constant

export const addLiquidity = async (
	signer,
	addCDAmountWei,
	addEtherAmountWei
) => {
	try {
		const tokenContract = new Contract(
			TOKEN_CONTRACT_ADDRESS,
			TOKEN_CONTRACT_ABI,
			signer
		)
		const exchangeContract = new Contract(
			EXCHANGE_CONTRACT_ADDRESS,
			EXCHANGE_CONTRACT_ABI,
			signer
		)
		// user permission to take CD as ERC20 tokens out of his contract
		let tx = await tokenContract.approve(
			EXCHANGE_CONTRACT_ADDRESS,
			addCDAmountWei.toString()
		);
		await tx.wait();
		// after approval add the ether and cd token in the liquidity
		tx = await exchangeContract.addLiquidity(addCDAmountWei, {
			value: addEtherAmountWei,
		});
		await tx.wait()
	} catch (error) {
		console.error(error);
	}

	// Calculate the CD tokens that need to be added to the liquidity given _addEtherAmountWei
	export const calculateCD = async (
		_addEther = "0",
		etherBalanceContract,
		cdTokenReserve
	) => {
		const _addEtherAmountWei = utils.parseEther(_addEther);
		const cryptoDevTokenAmount = _addEtherAmountWei.mul(cdTokenReserve).div(etherBalanceContract);
		return cryptoDevTokenAmount;
	}
}
