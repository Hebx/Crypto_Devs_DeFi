import {BigNumber, providers, utils} from "ethers";
import Head from "next/head";
import {useEffect, useState, useRef} from "react";
import Web3Modal, { getProviderDescription } from "web3modal";
import styles from "../styles/Home.module.css";
import {getAmountofTokensReceivedFromSwap, swapTokens} from "../utils/swap.js";
import { getEtherBalance, getCDTokensBalance, getLPTokensBalance, getReserveCDTokens } from "../utils/getAmount.js";
import {addLiquidity, calculateCD} from "../utils/addLiquidity.js"
import { removeLiquidity, getTokensAfterRemove } from "../utils/removeLiquidity";

export default function Home() {
	const [loading, setLoading] = useState(false);
	const [liquidityTab, setLiquidityTab] = useState(true);
	const zero = BigNumber.from(0);
	const [ethBalance, setEthBalance] = useState(zero);
	const [reservedCD, setReservedCD] = useState(zero);
	const [ethBalanceContract, setEthBalanceContract] = useState(zero);
	const [CDBalance, setCDBalance] = useState(zero);
	const [lpBalance, setLpBalance] = useState(zero);
	const [addEther, setAddEther] = useState(zero);
	const [addCDTokens, setAddCDTokens] = useState(zero);
	const [removeEth, setRemoveEth] = useState(zero);
	const [removeCD, setRemoveCD] = useState(zero);
	const [removeLPTokens, setRemoveLPTokens] = useState("0");
	const [swapAmount, setSwapAmount] = useState("");
	const [tokensToBeReceivedAfterSwap, setTokensToBeReceivedAfterSwap] = useState(zero);
	const [ethSelected, setEthSelected] = useState(true);
	const web3ModalRef = useRef();
	const [walletConnected, setWalletConnected] = useState(false);

	const getAmounts = async () => {
		try {
			const provider = await getProviderOrSigner(false);
			const signer = await getProviderOrSigner(true);
			const address = await signer.getAddress();
			const _ethBalance = await getEtherBalance(provider, address);
			const _CDBalance = await getCDTokensBalance(provider, address);
			const _lpBalance = await getLPTokensBalance(provider, address);
			const _reservedCD = await getReserveCDTokens(provider);
			const _ethBalanceContract = await getEtherBalance(provider, null, true);
			setEthBalance(_ethBalance);
			setCDBalance(_CDBalance);
			setLpBalance(_lpBalance);
			setReservedCD(_reservedCD);
			setEthBalanceContract(_ethBalanceContract);
		} catch (error) {
			console.error(error);
		}
	};

	// Swaps "swapAmountWei" of Eth/CD Tokens with "TokensToBeReceivedAfterSwap" amounts of Eth/CD Tokens
	const _swapTokens = async () => {
		try {
			// convert the amount entered to a BigNumber using parseEther lib from ethers.js
			const swapAmountWei = utils.parseEther(swapAmount);
			// check if the user entered zero using eq method from BigNumber class in ethers.js
			if (!swapAmountWei.eq(zero)) {
				const signer = await getProviderOrSigner(true);
				setLoading(true);
				await swapTokens(
					signer,
					swapAmountWei,
					tokensToBeReceivedAfterSwap,
					ethSelected
				);
				setLoading(false);
				await getAmounts();
				setSwapAmount("");
			}
		} catch (error) {
			console.error(error);
			setLoading(false);
			setSwapAmount("");
		}
	};

// Returns the number of Eth/Crypto Dev tokens that can be recieved
// when the user swaps `_swapAmountWEI` amount of Eth/Crypto Dev tokens.
	const _getAmountOfTokensReceivedFromSwap = async (_swapAmount) => {
		try {
			const _swapAmountWEI = utils.parseEther(_swapAmount.toString());
			if (!_swapAmountWEI.eq(zero)) {
				const provider = await getProviderOrSigner();
				const _ethBalance = await getEtherBalance(provider, null, true);
				const amountOfTokens = await getAmountofTokensReceivedFromSwap(
					_swapAmountWEI,
					provider,
					ethSelected,
					_ethBalance,
					reservedCD
				);
				setTokensToBeReceivedAfterSwap(amountOfTokens);
			} else {
				setTokensToBeReceivedAfterSwap(zero)
			}
		} catch (error) {
			console.error(error);
		}
	};

	// LIQUIDITY
	// if initial liquidity -> user decide the amount to the exchange
	// if not -> we calculate CDT he can add, given the eth he wants to add
	// constant ratio
	const _addLiquidity = async () => {
		try {
			const addEthWei = utils.parseEther(addEther.toString());
			if (!addEthWei.eq(zero) && !addCDTokens.eq(zero)) {
				const signer = await getProviderOrSigner(true);
				setLoading(true);
				await addLiquidity(signer, addCDTokens, addEthWei);
				setLoading(false);
				// reintialize the CD tokens
				setAddCDTokens(zero);
				// get amounts for all values after liquidity has been added
				await getAmounts();
			} else {
				setAddCDTokens(zero);
			}
		} catch (error) {
			console.error(error);
			setLoading(false);
			setAddCDTokens(zero);
		}
	};

	// removes the "removeLPTokensWei" amount of LP tokens from liquidity and the calculated amount of Eth and CD
	const _removeLiquidity = async () => {
		try {
			const signer = await getProviderOrSigner(true);
			// convert LP Tokens entered by the user to a BigNumber
			const removeLPTokensWei = utils.parseEther(removeLPTokens);
			setLoading(true);
			await removeLiquidity(signer, removeLPTokensWei);
			setLoading(false);
			await getAmounts();
			setRemoveCD(zero);
			setRemoveEth(zero);
		} catch (error)
		{
			console.error(error);
			setLoading(false);
			setRemoveCD(zero);
			setRemoveEth(zero);
		}
	};

	  /**
   * _getTokensAfterRemove: Calculates the amount of `Ether` and `CD` tokens
   * that would be returned back to user after he removes `removeLPTokenWei` amount
   * of LP tokens from the contract
   */
	const _getTokensAfterRemove = async (_removeLPTokens) => {
		try {
			const provider = await getProviderOrSigner();
			const removeLPTokensWei = utils.parseEther(_removeLPTokens);
			const _ethBalance = await getEtherBalance(provider, null, true);
			const CDTokenReserve = await getReserveCDTokens(provider);
			const {_removeEther, _removeCD} = await getTokensAfterRemove(
				provider,
				removeLPTokensWei,
				_ethBalance,
				CDTokenReserve
			)
			setRemoveEth(_removeEther);
			setRemoveCD(_removeCD);
		} catch (error) {
			console.error(error);
		}
	}

	const connectWallet = async () => {
		try {
			await getProviderOrSigner();
			setWalletConnected(true);
		} catch (error) {
			console.error(error);
		}
	}

	const getProviderOrSigner = async (needSigner = false) => {
		const provider = await web3ModalRef.current.connect();
		const web3Provider = new providers.Web3Provider(provider);
		const { chainId } = await web3Provider.getNetwork();
		if (chainId !== 4) {
			window.alert("change the network to rinkeby");
			throw new Error("Change Network to Rinkeby");
		}
		if (needSigner) {
			const signer = web3Provider.getSigner();
			return signer;
		}
		return web3Provider;
	}

	useEffect(() => {
		if (!walletConnected) {
			web3ModalRef.current = new Web3Modal({
				network: "rinkeby",
				providerOptions: {},
				disableInjectedProvider: false,
			})
			connectWallet();
			getAmounts();
		}
	}, [walletConnected]);

	const renderButton = () => {
		if (!walletConnected) {
			return (
			  <button onClick={connectWallet} className={styles.button}>
				Connect your wallet
			  </button>
			);
		  }
		if (loading) {
			return <button className={styles.button}>Loading...</button>;
		}
		if (liquidityTab) {
			return (
				<div>

				<div className={styles.description}>
					You Have
					<br />
					{/* Convert the BigNumber to string using formatEther from ethers.js */}
					{utils.formatEther(CDBalance)} Crypto Dev Tokens
					<br />
					{utils.formatEther(ethBalance)} Ether
					<br />
					{utils.formatEther(lpBalance)} Crypto Dev LP Tokens
				</div>
				<div>
            {/* If reserved CD is zero, render the state for Initial liquidity zero
			else render the state where liquidity is not zero
			Calculate based on the `Eth` amount specified by the user how much `CD` tokens can be added */}
				{utils.parseEther(reservedCD.toString()).eq(zero) ? (
					<div>
						<input
							type="number"
							placeholder="Amount of Ether"
							onChange={(e) => setAddEther(e.target.value || "0")}
							className={styles.input} />
						<input
							type="number"
							placeholder="Amount of CryptoDev Tokens"
							onChange={(e) => setAddCDTokens(BigNumber.from(utils.parseEther(e.target.value || "0")))}
							className={styles.input} />
				<button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
					</div>
				): (
					<div>
						<input
							type="number"
							placeholder="Amount of Ether"
							onChange={async (e) => {setAddEther(e.target.value || "0");
								// calculate the number of CD tokens that can be added given `e.target.value` amount of Eth
							const _addCDTokens = await calculateCD(
								e.target.value || "0",
								ethBalanceContract,
								reservedCD
							);
							setAddCDTokens(_addCDTokens);
							}}
							className={styles.input}
					/>
					<div className={styles.inputDiv}>
						{`You will need ${utils.formatEther(addCDTokens)} Crypto Dev Tokens`} </div>
				<button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
					</div>
				)}
				<div>
				<input
                type="number"
                placeholder="Amount of LP Tokens"
				onChange={async (e) => {
					setRemoveLPTokens(e.target.value || "0");
					// Calculate the amout of ether and CD tokens that the user would receive after he removes `e.target.value amount of LP tokens`
					await _getTokensAfterRemove(e.target.value || "0");
				}}
				className={styles.input}
				/>
				<div className={styles.inputDiv}>
					{`You will get ${utils.formatEther(removeCD)} Crypto Dev Tokens and ${utils.formatEther(removeEth)} Eth`}
				</div>
				<button className={styles.button1} onClick={_removeLiquidity}>
                Remove
              </button>
			</div>
		</div>
	</div>
			);
	} else {
		return (
		<div>
			<input
            type="number"
            placeholder="Amount"
            onChange={async (e) => {
              setSwapAmount(e.target.value || "");
			  // Calculate the amount of tokens user would recieve after the swap
				 await _getAmountOfTokensReceivedFromSwap(e.target.value || "0");
				}}
				className={styles.input}
				value={swapAmount}
			  />
			<select
            className={styles.select}
            name="dropdown"
            id="dropdown"
            onChange={async () => {
              setEthSelected(!ethSelected);
              // Initialize the values back to zero
              await _getAmountOfTokensReceivedFromSwap(0);
              setSwapAmount("");
            }}
          >
			<option value="eth">Ethereum</option>
            <option value="cryptoDevToken">Crypto Dev Token</option>
		  </select>
			<br/>
			<div className={styles.inputDiv}>
				{ethSelected ? `You will get ${utils.formatEther(tokensToBeReceivedAfterSwap)} Crypto Dev Tokens` :
				`You will get ${utils.formatEther(
					tokensToBeReceivedAfterSwap
				  )} Eth`}
			</div>
			<button className={styles.button1} onClick={_swapTokens}>
            Swap
        	</button>
		</div>
		);
	}
}
return (
	<div>
		<Head>
		<title>Crypto Devs</title>
        <meta name="description" content="Exchange-Dapp" />
        <link rel="icon" href="/favicon.ico" />
		</Head>
		<div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs Exchange!</h1>
          <div className={styles.description}>
            Exchange Ethereum &#60;&#62; Crypto Dev Tokens
          </div>
          <div>
            <button
              className={styles.button}
              onClick={() => {
                setLiquidityTab(!liquidityTab);
              }}
            >
              Liquidity
            </button>
            <button
              className={styles.button}
              onClick={() => {
                setLiquidityTab(false);
              }}
            >
              Swap
            </button>
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
