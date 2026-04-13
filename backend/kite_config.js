const KITE_NETWORKS = {
  testnet: {
    key: 'testnet',
    chainName: 'KiteAI Testnet',
    chainId: 2368,
    rpcUrl: 'https://rpc-testnet.gokite.ai/',
    explorerUrl: 'https://testnet.kitescan.ai/',
    faucetUrl: 'https://faucet.gokite.ai',
    stablecoinGaslessUrl: 'https://gasless.gokite.ai',
    bundlerUrl: 'https://bundler-service.staging.gokite.ai/rpc/',
  },
  mainnet: {
    key: 'mainnet',
    chainName: 'KiteAI Mainnet',
    chainId: 2366,
    rpcUrl: 'https://rpc.gokite.ai/',
    explorerUrl: 'https://kitescan.ai/',
    stablecoinGaslessUrl: 'https://gasless.gokite.ai',
  },
};

function getKiteNetwork() {
  const selected = process.env.KITE_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
  return KITE_NETWORKS[selected];
}

module.exports = {
  KITE_NETWORKS,
  getKiteNetwork,
};
