import { useState } from "react";
import { useWallet } from '@meshsdk/react';
import styles from './CardanoProposals.module.css';
import { CardanoWallet } from '@meshsdk/react';


const ProposalsPage = ({ proposals, error }) => {

  const { connected, wallet } = useWallet();
  const [assets, setAssets] = useState<null | any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<Record<string, string>>({});

  const handleSubmit = async (tx_hash: string, event: React.FormEvent) => {
    event.preventDefault()
    try {
      const walletAddress = await wallet.getChangeAddress();
      const objeto =  { wallet_address: walletAddress , proposal_tx_hash: tx_hash, vote: selectedOption[tx_hash] }
      console.log(objeto)
      const response = await fetch('/api/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(objeto),
      });

    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };


const handleInputChange = (tx_hash: string, value: string ) => {
  setSelectedOption((prev) => ({
    ...prev,
    [tx_hash]: value,
  }))
};

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (

    <div className={styles.contents}>

      <div className={styles.titleDiv}>
        <h1>Cardano Governance Proposals</h1>
      </div>
      <div className={styles.connectWallet}>
        <h1>Connect Wallet</h1>
          <CardanoWallet />
      </div>
    {connected && (
    <>
    <div className={styles.proposalsContainer}>
      {proposals && proposals.length > 0 ? (
        <ul>
          {proposals.map((proposal) => (
            <li key={proposal.tx_hash}>
              <div className={styles.proposalHeader}>
                <div className={styles.proposalInfo}>
                  <h2>{proposal.title}</h2>
                  <p><strong>ID:</strong> {proposal.tx_hash}</p>
                </div>
                <div className={styles.proposalLink}>
                  <a href={`https://cardanoscan.io/transaction/${proposal.tx_hash}?tab=govActions`} target="_blank" rel="noopener noreferrer">View on Cardanoscan</a>
                </div>
              </div>
              <form onSubmit={(e) => handleSubmit(proposal.tx_hash, e)} className={styles.form}>
                <div className={styles.buttonsContainer}>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="choice"
                        value="yes"
                        checked={selectedOption[proposal.tx_hash] === 'yes'}
                        onChange={(e) => handleInputChange(proposal.tx_hash, e.target.value)}
                        className={styles.radioInput}
                      />
                      Yes
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="choice"
                        value="no"
                        checked={selectedOption[proposal.tx_hash] === 'no'}
                        onChange={(e) => handleInputChange(proposal.tx_hash, e.target.value)}
                        className={styles.radioInput}
                      />
                      No
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="choice"
                        value="abstain"
                        checked={selectedOption[proposal.tx_hash] === 'abstain'}
                        onChange={(e) => handleInputChange(proposal.tx_hash, e.target.value)}
                        className={styles.radioInput}
                      />
                      Abstain
                    </label>
                  </div>
                  <button type="submit" className={styles.submitButton}>
                    Submit
                  </button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.noProposals}>No proposals found.</p>
      )}
    </div>
    </>
    )} { !connected && (
      <p className={styles.noProposals}>Please connect your wallet to view proposals.</p>
    
    )}


  </div>
  );
};



export const getServerSideProps = async () => {
  const url = 'https://cardano-mainnet.blockfrost.io/api/v0/governance/proposals';
  const headers = {
    'Accept': 'application/json',
    'project_id': 'mainnetH33gpqGTjsLKdcSNQmGCBiiieWsKIkoO', // Replace with your actual project ID
  };

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { props: { proposals: data } };
  } catch (error) {
    return { props: { proposals: null, error: error.message } };
  }
};

export default ProposalsPage;
