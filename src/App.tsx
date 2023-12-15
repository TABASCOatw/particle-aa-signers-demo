import React, { useState } from 'react';
import { AlchemyProvider } from '@alchemy/aa-alchemy';
import { LightSmartContractAccount } from '@alchemy/aa-accounts';
import { polygonMumbai } from 'viem/chains';
import { ethers } from 'ethers';
import { ParticleSigner } from '@alchemy/aa-signers/particle';
import { notification } from 'antd';

import './App.css';

const App = () => {
  const [providerState, setProviderState] = useState(null);
  const [accountAddress, setAccountAddress] = useState(null);
  const [ownerAddress, setOwnerAddress] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

  const initializeParticleSigner = async (preferredAuthType) => {
    const particleSigner = new ParticleSigner({
      projectId: process.env.REACT_APP_PROJECT_ID as string,
      clientKey: process.env.REACT_APP_CLIENT_KEY as string,
      appId: process.env.REACT_APP_APP_ID as string,
      chainName: "polygon",
      chainId: 80001,
    });

    await particleSigner.authenticate({
      loginOptions: { preferredAuthType },
      login: async (loginOptions) => {
        await particleSigner.inner.auth.login(loginOptions);
      },
    });

    return particleSigner;
  };

  const initializeProvider = async (particleSigner) => {
    return new AlchemyProvider({
      apiKey: process.env.ALCHEMY_API_KEY,
      chain: polygonMumbai,
      entryPointAddress,
    }).connect(rpcClient => new LightSmartContractAccount({
      entryPointAddress,
      chain: rpcClient.chain,
      owner: particleSigner,
      factoryAddress: "0x000000893A26168158fbeaDD9335Be5bC96592E2",
      rpcClient,
    }));
  };

  const handleLogin = async (preferredAuthType) => {
    const particleSigner = await initializeParticleSigner(preferredAuthType);
    setUserInfo(await particleSigner.getAuthDetails());

    const provider = await initializeProvider(particleSigner);
    setProviderState(provider);

    if (provider?.account?.owner) {
      setOwnerAddress(await provider.account.owner.getAddress());
      setAccountAddress(await provider.getAddress());
    }
  };

  const getBalance = async () => {
    const balance = await providerState.request({
      method: "eth_getBalance",
      params: [accountAddress],
    });
    notification.success({
      message: "Balance Check Successful",
      description: `${ethers.utils.formatEther(balance)} MATIC`,
    });
  };

  const executeUserOperation = async () => {
    providerState.withAlchemyGasManager({
      policyId: process.env.ALCHEMY_POLICY_ID,
      entryPoint: entryPointAddress,
    });

    const txHash = await providerState.sendTransaction({
      to: "0x000000000000000000000000000000000000dEaD",
      value: ethers.utils.parseEther("0.001"),
    });

    notification.success({
      message: "User Operation Success",
      description: `Transaction Hash: ${txHash}`,
    });
  };

  return (
    <div className="App">
      <div className="logo-section">
        <img className="logo" src="https://i.imgur.com/EerK7MS.png" />
        <img className="logo" src="https://i.imgur.com/EylDr6H.png" />
      </div>
      {providerState ? (
        <>
          <div className="profile-card">
            <h2>{userInfo.name}</h2>
            <div className="address-section">
              <span>Account Address: </span>
              <span className="address">{accountAddress}</span>
            </div>
            <div className="address-section">
              <span>Owner Address: </span>
              <span className="address">{ownerAddress}</span>
            </div>
            <button className="sign-button balance-button" onClick={getBalance}>Check Balance</button>
            <button 
              style={{ backgroundColor: 'darkblue', color: 'white', marginTop: '10px' }} 
              onClick={executeUserOperation}
            >
              Execute User Operation
            </button>

          </div>
        </>
      ) : (
      <div className="login-section">
        <button className="sign-button google-button" onClick={() => handleLogin('google')}>
          <img src="https://i.imgur.com/nIN9P4A.png" alt="Google" className="icon"/>
          Sign in with Google
        </button>
        <button className="sign-button twitter-button" onClick={() => handleLogin('twitter')}>
          <img src="https://i.imgur.com/afIaQJC.png" alt="Twitter" className="icon"/>
          Sign in with X
        </button>
      </div>
      )}
    </div>
  );
};

export default App;