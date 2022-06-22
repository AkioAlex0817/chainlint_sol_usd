import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { ChainlinkTest } from "../target/types/chainlink_test";

const CHAINLINK_PROGRAM_ID = "HgTtcbcmp5BeThax5AU8vg4VwK79qAvAKKFMs8txMLW6";
// SOL/USD feed account
const CHAINLINK_FEED = "2ypeVyYnZaW2TNYXXTaZq9YhYvnqcjCiifW1C6n8b7Go";
const DIVISOR = 100000000;

describe("chainlink_test", () => {
  const provider = anchor.AnchorProvider.env();
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  const program = anchor.workspace.ChainlinkTest as Program<ChainlinkTest>;

  it("Query SOL/USD Price Feed!", async () => {
    //create an account to store the price data
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
      .signers([priceFeedAccount])
      .rpc();

    // Fetch the account details of the account containing the price data
    const latestPrice = await program.account.decimal.fetch(
      priceFeedAccount.publicKey
    );
    // @ts-ignore
    console.log("Price Is: " + latestPrice.value / DIVISOR);

    // Ensure the price returned is a positive value
    //assert.ok(latestPrice.value / DIVISOR > 0);
  });
});
