const crypto = require('crypto');
const { getKiteNetwork } = require('./kite_config');

function shortHash(value) {
  return crypto.createHash('sha256').update(value).digest('hex').substring(0, 16);
}

function createExecutionAttestation({ input, output, transactionId, model, mode }) {
  const kiteNetwork = getKiteNetwork();
  const timestamp = new Date().toISOString();

  return {
    inputHash: shortHash(input),
    outputHash: shortHash(output),
    algorithm: 'SHA-256',
    attestationStatus: 'kite-ready-simulated',
    timestamp,
    kite: {
      network: kiteNetwork.key,
      chainId: kiteNetwork.chainId,
      attestationMode: 'offchain-now-onchain-later',
      explorerUrl: kiteNetwork.explorerUrl,
    },
    metadata: {
      transactionId,
      model,
      mode,
    },
  };
}

module.exports = {
  createExecutionAttestation,
};
