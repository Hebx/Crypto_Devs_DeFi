import {Contract} from "ethers";
import { EXCHANGE_CONTRACT_ADDRESS,
EXCHANGE_CONTRACT_ABI,
TOKEN_CONTRACT_ADDRESS,
TOKEN_CONTRACT_ABI } from "../constants/index";

// retrieves the ether balance of the user of the contract
export const getEtherBalance = async (
	provider,
	address,
	contract = false
) => {
	try {
		// if the caller set the contract bool to true retrieve the balance of ether in the exchange contract
		// else retrieve the balance of the user's address
		if (contract) {
			const balance = await provider.getBalance(EXCHANGE_CONTRACT_ADDRESS);
			return balance;
		} else {
			const balance = await provider.getBalance(address);
			return balance;
		}
	} catch (error) {
		console.error(error);
		return 0;
	}
};

// retrieve the CD tokens balance of the user's address
export const getCDTokensBalance = async (
	provider,
	address
) => {
	try {
		const tokenContract = new Contract(
			TOKEN_CONTRACT_ADDRESS,
			TOKEN_CONTRACT_ABI,
			provider
		);
		const balanceOfCDTokens = await tokenContract.balanceOf(address);
		return balanceOfCDTokens;
	} catch (error) {
		console.error(error);
	}
};

// retrieve the LP tokens in the account of the provided address
export const getLPTokensBalance = async (provider, address) => {
	try {
		const exchangeContract = new Contract(
			EXCHANGE_CONTRACT_ADDRESS,
			EXCHANGE_CONTRACT_ABI,
			provider
			);
		const balanceOfLPTokens = await exchangeContract.balanceOf(address);
		return balanceOfLPTokens;
	} catch (error) {
		console.error(error);
	}
}

// get reserve of CD Tokens in the exchange contract address
export const getReserveCDTokens = async (provider) => {
	try {
		const exchangeContract = new Contract(
			EXCHANGE_CONTRACT_ADDRESS,
			EXCHANGE_CONTRACT_ABI,
			provider
		);
		const reserve = await exchangeContract.getReserve();
		return reserve;
	} catch (error) {
		console.error(error);
	}
}

