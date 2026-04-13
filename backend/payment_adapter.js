const crypto = require('crypto');
const { getKiteNetwork } = require('./kite_config');

function createExecutionTransaction({ cost, currency = 'USD', mode, model, inputLength, outputLength }) {
  const kiteNetwork = getKiteNetwork();
  const txId = `0x${crypto.randomBytes(8).toString('hex')}`;
  const reference = `inkagent-${Date.now()}`;

  return {
    id: txId,
    reference,
    cost: `$${cost.toFixed(2)}`,
    amount: cost,
    currency,
    status: 'settled',
    paymentRail: 'kite-ready-simulated',
    executionType: 'writing-task',
    timestamp: new Date().toISOString(),
    kite: {
      network: kiteNetwork.key,
      chainName: kiteNetwork.chainName,
      chainId: kiteNetwork.chainId,
      rpcUrl: kiteNetwork.rpcUrl,
      explorerUrl: kiteNetwork.explorerUrl,
      settlementMode: 'simulated-now-kite-ready-later',
    },
    metadata: {
      mode,
      model,
      inputLength,
      outputLength,
    },
  };
}

module.exports = {
  createExecutionTransaction,
};
