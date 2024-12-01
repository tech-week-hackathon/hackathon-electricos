import { useState, useEffect } from "react";
import { useWallet } from '@meshsdk/react';
import styles from '../styles/CardanoProposals.module.css';
import { CardanoWallet } from '@meshsdk/react';
import { BrowserWallet } from "@meshsdk/core";

const navigateTo = (path: string) => {
  window.location
    ? window
        .location
        .assign(path)
    : null;
}


const ProposalsPage = ({ proposals, error }) => {

  const { connected, wallet } = useWallet();
  const [assets, setAssets] = useState<null | any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<Record<string, string>>({});
  const [votes, setVotes] = useState<null | any>(null);
  const [walletAdd, setWalletAdd] = useState<string>('');


  useEffect(() => {
    // Fetch the votes from the database calling api/getVotes.ts
    const fetchVotes = async () => {
      const response = await fetch('/api/getVotes');
      const data = await response.json();
      setVotes(data);
    }

    fetchVotes();
  }, []);

  // useEffect to change wallet address when the wallet connects or disconnecs
  useEffect(() => {
    if (connected) {
      wallet.getRewardAddresses().then((addresses) => {
        setWalletAdd(addresses[0]);
      });
    }
  }, [connected, wallet]);


  const hasVoted = (proposal_tx_hash: string, wallet_address: string) => {
    if (!votes)
      return null;

    const vote = votes.find((vote) => vote.proposal_tx_hash === proposal_tx_hash && vote.wallet_address === wallet_address);
    return vote ? vote.vote : null;
  }

  const handleSubmit = async (tx_hash: string, event: React.FormEvent) => {
    event.preventDefault()
    try {
      const walletAddress = (await wallet.getRewardAddresses())[0];
      const walletAmount = (await wallet.getBalance())[0]['quantity']
      const objeto =  { wallet_address: walletAddress , proposal_tx_hash: tx_hash, amount: walletAmount, vote: selectedOption[tx_hash] }
      console.log(objeto)
      const response = await fetch('/api/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(objeto),
      });

      if (response.ok) {
        const updatedVotes = await response.json();
        setVotes((prevVotes) => {
          const newVotes = [...prevVotes, ...updatedVotes];
          console.log('Vote submitted successfully:', newVotes);
          return newVotes;
        });
        setSelectedOption((prev) => ({
          ...prev,
          [tx_hash]: '',
        }));
      }

    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleSubmitAll = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const walletAddress = (await wallet.getRewardAddresses())[0];
      const walletAmount = (await wallet.getBalance())[0]['quantity']
      const promises = proposals.map(async (proposal) => {
        const objeto = {
          wallet_address: walletAddress,
          proposal_tx_hash: proposal.tx_hash,
          amount: walletAmount,
          vote: selectedOption[proposal.tx_hash],
        };
        console.log(objeto);
        return fetch('/api/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(objeto),
        });
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Error submitting all forms:', error);
    }
  };

const handleClearAll = async () => {
  // For all the proposals, set selected option to ''
  setSelectedOption((prev) => {
    const newSelectedOption = { ...prev };
    proposals.forEach((proposal) => {
      newSelectedOption[proposal.tx_hash] = '';
    });
    return newSelectedOption;
  });


}


const handleInputChange = (tx_hash: string, value: string ) => {
  setSelectedOption((prev) => ({
    ...prev,
    [tx_hash]: value,
  }))
};

  if (error) {
    return <div className={styles.noProposals}>Error: {error}</div>;
  }

  return (

    <>
      <header className={styles.header}>
        <nav>
            <ul>
                <li>
                    <button onClick={() => navigateTo('/')}>Home</button>
                </li>
                <li>
                    <button onClick={() => navigateTo('/cardanoproposals2')}>Vote</button>
                </li>
                <li>
                    <button onClick={() => navigateTo('/DReps')}>See DReps</button>
                </li>
                <li>
                  <button onClick={() => navigateTo('/comparedreps')}>Compare DReps</button>
                </li>
            </ul>
        </nav>
    </header>
    <div className={styles.contents}>

      <div className={styles.titleDiv}>
        <h1>Cardano Governance Proposals</h1>
      </div>
      <div className={styles.connectWallet}>
        <h2>Connect Wallet</h2>
        <CardanoWallet />
      </div>
    {connected && (
    <>
      {proposals && proposals.length > 0 ? (
    <div className={styles.proposalsContainer}>
        <ul>
          {proposals.map((proposal) => (
            <li key={proposal.tx_hash}>
              <div className={styles.abc}>
              <div className={styles.proposalHeader}>
                <div className={styles.proposalInfo}>
                  <h2>{proposal.title}</h2>
                  <p><strong>ID:</strong> {proposal.tx_hash}</p>
                  <p><strong>Title: </strong>Estaría bueno obtener al menos el título de cada proposal.</p>

                </div>
                <div className={styles.proposalLink}>
                  <a href={`https://cardanoscan.io/transaction/${proposal.tx_hash}?tab=govActions`} target="_blank" rel="noopener noreferrer">View on Cardanoscan</a>
                </div>
              </div>
              {votes.find((vote) => vote.proposal_tx_hash === proposal.tx_hash && vote.wallet_address === walletAdd) && (
                    <p className={styles.alreadyVotedText}><strong>Already voted this proposal. You voted:</strong> {votes.find((vote) => vote.proposal_tx_hash === proposal.tx_hash && vote.wallet_address === walletAdd).vote}</p>
                  )}
              </div>
              <form onSubmit={(e) => handleSubmit(proposal.tx_hash, e)} className={styles.form}>
                <div className={styles.buttonsContainer}>
                  <div className={styles.radioGroup}>
                    {['yes', 'no', 'abstain'].map((option) => (
                      <label key={option} className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="choice"
                          required
                          value={option}
                          checked={selectedOption[proposal.tx_hash] === option}
                          onChange={(e) => handleInputChange(proposal.tx_hash, e.target.value)}
                          className={styles.radioInput}
                        />
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </label>
                    ))}
                  </div>
                  <button type="submit" className={styles.submitButton}>
                    {hasVoted(proposal.tx_hash, walletAdd) ? (
                      <span>Change Vote</span>
                    ) : (
                      "Submit"
                    )}
                  </button>
                </div>
              </form>
            </li>
          ))}
        </ul>
        <div className={styles.proposalsContainerFooter}>
          <button 
            onClick={handleClearAll} 
            className={styles.clearAllButton}
          >
            Clear Selections
          </button>
          <button 
            onClick={handleSubmitAll} 
            className={styles.submitAllButton}
          >
            Submit All
          </button>
        </div>
    </div>

      ) 
      : (
        <p className={styles.noProposals}>No proposals found.</p>
      )}
    </>
    )} { !connected && (
      <p className={styles.noProposals}>Please connect your wallet to view proposals and cast your vote.</p>
    
    )}


  </div>
  </>);
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

