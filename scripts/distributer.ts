import * as anchor from "@project-serum/anchor";
import {program} from "commander";
import {loadWallet} from "./utils";
import {AnchorProvider, Program} from "@project-serum/anchor";
import {clusterApiUrl, Connection} from "@solana/web3.js";

import {IDL, ChainlinkTest} from "../target/types/chainlink_test";

program.version("0.0.1");

program
    .command("data_feed")
    .requiredOption("-k, --keypair <path>", `Solana Wallet Location`)
    .option(
        "-e, --env <string>",
        `Solana cluster env name. One of: mainnet-beta, testnet, devnet`,
        "devnet"
    )
    .action(async (_directory: any, cmd: any) => {
        const {keypair, env} = cmd.opts();
        const CHAINLINK_PROGRAM_ID = "HEvSKofvBgfaexv23kMabbYqxasxU3mQ4ibBMEmJWHny";
        // SOL/USD feed account
        const CHAINLINK_FEED = "HgTtcbcmp5BeThax5AU8vg4VwK79qAvAKKFMs8txMLW6";
        const DIVISOR = 100000000;
        const serviceKeyPair = loadWallet(keypair);
        const provideOptions = AnchorProvider.defaultOptions();
        const connection = new Connection(
            clusterApiUrl(env),
            provideOptions.commitment
        );
        const walletWrapper = new anchor.Wallet(serviceKeyPair);
        const provider = new AnchorProvider(connection, walletWrapper, {
            preflightCommitment: "confirmed",
        });
        const programId = new anchor.web3.PublicKey("F1j1twktTSRv1e5rGF5cA18eyhdW8fhherW6k9aPvChq");
        const program = new Program<ChainlinkTest>(IDL, programId, provider);

        const priceFeedAccount = anchor.web3.Keypair.generate();
        // Execute the RPC.
        let tx = await program.methods
            .execute()
            .accounts({
                decimal: priceFeedAccount.publicKey,
                user: provider.wallet.publicKey,
                chainlinkFeed: new anchor.web3.PublicKey(CHAINLINK_FEED),
                chainlinkProgram: new anchor.web3.PublicKey(CHAINLINK_PROGRAM_ID),
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([serviceKeyPair, priceFeedAccount])
            .rpc();
        // Fetch the account details of the account containing the price data
        const latestPrice = await program.account.decimal.fetch(
            priceFeedAccount.publicKey
        );
        // @ts-ignore
        console.log("Price Is: " + latestPrice.value / DIVISOR);
    });
program.parse(process.argv);