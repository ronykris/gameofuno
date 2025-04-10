const { Asset, Aurora, Keypair, Operation, BASE_FEE, TransactionBuilder, Claimant } = require("diamnet-sdk");
require('dotenv').config();

// Load secret key from environment variable (server-side only)
const DIAMNET_SECRET_KEY = process.env.DIAMNET_SECRET_KEY;

/**
 * Creates a claimable balance for the specified destination address
 * @param {string} destinationPublicKey - The public key of the destination account
 * @param {string} amount - The amount to lock in the claimable balance (default: "5")
 * @returns {Promise<Object>} - The transaction result
 */
async function createClaimableBalance(destinationPublicKey, amount = "5") {
  if (!DIAMNET_SECRET_KEY) {
    throw new Error("DIAMNET_SECRET_KEY environment variable is not set");
  }

  const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
  const sourceKeypair = Keypair.fromSecret(DIAMNET_SECRET_KEY);

  try {
    // Load the source account
    const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

    // Creates a claimant object with an unconditional predicate
    const claimant = new Claimant(
      destinationPublicKey,
      Claimant.predicateUnconditional()
    );

    // Create the claimable balance entry operation
    const claimableBalanceOp = Operation.createClaimableBalance({
      asset: Asset.native(), // Asset type (DIAM in this case)
      amount: amount, // Amount to lock in the claimable balance
      claimants: [claimant], // Add the claimant to the claimable balance
    });

    // Build the transaction
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: "Diamante Testnet 2024",
    })
      .addOperation(claimableBalanceOp)
      .setTimeout(30)
      .build();

    // Sign the transaction
    transaction.sign(sourceKeypair);

    // Submit the transaction
    const result = await server.submitTransaction(transaction);
    console.log("Transaction successful:", result.hash);
    
    // Extract the balance ID from the transaction result
    let txResult = xdr.TransactionResult.fromXDR(
      result.result_xdr,
      "base64"
    );
    let results = txResult.result().results();
    
    // We look at the first result since our first (and only) operation
    // in the transaction was the CreateClaimableBalanceOp.
    let operationResult = results[0].value().createClaimableBalanceResult();
    let balanceId = operationResult.balanceId().toXDR("hex");
    
    return {
      success: true,
      balanceId: balanceId,
      transactionHash: result.hash
    };
  } catch (error) {
    console.error("Transaction submission error:", error);
    throw error;
  }
}

module.exports = {
  createClaimableBalance
};
