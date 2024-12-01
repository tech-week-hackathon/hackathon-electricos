import { useWallet } from '@meshsdk/react';
import { CardanoWallet } from '@meshsdk/react';
import { useState, useEffect, useRef } from 'react'
import styles from './DReps.module.css'
import { keepRelevant } from '@meshsdk/core';
import { BlockfrostProvider, MeshTxBuilder } from "@meshsdk/core";

const navigateTo = (path: string) => {
  window.location
    ? window
        .location
        .assign(path)
    : null;
}

// En dreps tenemos una lista de dreps.
// Cada drep consiste de un drep_id y de un hex.

// En base a cada drep, tenemos que encontrar:
//    - sus votos
//    - sus delegators
const DRepsPage = ({ dreps, proposals, error }) => {
    const { connected, wallet } = useWallet();
    const [selectedDRep, setSelectedDRep] = useState("")
    const [selectedProposal, setSelectedProposal] = useState("")
    const [drepInput, setDrepInput] = useState("")
    const [proposalInput, setProposalInput] = useState("")
    const [showDrepDropdown, setShowDrepDropdown] = useState(false)
    const [showProposalDropdown, setShowProposalDropdown] = useState(false)
    const [searchPerformed, setSearchPerformed] = useState(false)
    const [votingResults, setVotingResults] = useState(null)
    
    const drepRef = useRef<HTMLDivElement>(null)
    const proposalRef = useRef<HTMLDivElement>(null)
  
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (drepRef.current && !drepRef.current.contains(event.target as Node)) {
          setShowDrepDropdown(false)
        }
        if (proposalRef.current && !proposalRef.current.contains(event.target as Node)) {
          setShowProposalDropdown(false)
        }
      }
  
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [])
  
    const getFilteredDreps = () => {
      const startsWithInput = dreps.filter(drep => drep.drep_id.toLowerCase().startsWith(drepInput.toLowerCase()))
      const uniqueMap = new Map();
  
      startsWithInput.forEach(item => {
        if (!uniqueMap.has(item.drep_id)) {
          uniqueMap.set(item.drep_id, item);
        }
      });
    
      return Array.from(uniqueMap.values());
    }
      
    const filteredDreps = getFilteredDreps();
    
    const getFilteredProposals = () => {
      const startsWithInput = proposals.filter(p => p.tx_hash.toLowerCase().startsWith(proposalInput.toLowerCase()))
      const uniqueMap = new Map();
    
      startsWithInput.forEach(item => {
        if (!uniqueMap.has(item.tx_hash)) {
          uniqueMap.set(item.tx_hash, item);
        }
      });
    
      return Array.from(uniqueMap.values());
    }
  
    const filteredProposals = getFilteredProposals();
  
    const handleDrepSelect = () => {
      setShowDrepDropdown(true)
    }
  
    const handleProposalSelect = () => {
      setShowProposalDropdown(true)
    }

    const getDelegatorsOf = async (drep_id: string) => {
      try{
          const response = await fetch(`https://cardano-mainnet.blockfrost.io/api/v0/governance/dreps/${drep_id}/delegators`, {
              headers: {
              Project_id: 'mainnetH33gpqGTjsLKdcSNQmGCBiiieWsKIkoO'
              }
          })
    
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
        
          const data = await response.json();
            console.log(`Delegators of Drep ${drep_id}: ${JSON.stringify(data)}`);
          return data;
      } catch (err) {
          console.error('Falló la búsqueda de los delegators del DREP: ' + drep_id)
      }
    }


    const getVotesOfDelegators = async (delegators: string[], proposal_tx_hash: string) => {
      // Fetch the app api to get all the votes of a delegator.
      const response = await fetch('/api/getVotes');
      const data = await response.json();
      
      console.log(`ALL VOTES: ${JSON.stringify(data)}`);

      // Filter the votes to get only the ones of the proposal.
      const proposalVotes = data.filter(vote => vote.proposal_tx_hash === proposal_tx_hash);

      const yesVotes = proposalVotes.filter(vote => vote.vote === "yes");
      const noVotes = proposalVotes.filter(vote => vote.vote === "no");
      const abstainVotes = proposalVotes.filter(vote => vote.vote === "abstain");

      let delegatorVotes = {"yes": yesVotes.length, "no": noVotes.length, "abstain": abstainVotes.length};

      return delegatorVotes;
    }

  
    const handleSearch = async () => {
      // Here you would typically fetch the voting results based on selectedDRep and selectedProposal
      // For this example, we'll use mock data
      const drep_id = selectedDRep;
      const proposal_tx_hash = selectedProposal;
      const delegators = await getDelegatorsOf(drep_id);


      // Get the votes of the delegators for the proposal
      const delegatorVotes = await getVotesOfDelegators(delegators, proposal_tx_hash);

      console.log(`Votes of the delegators for the proposal ${proposal_tx_hash}: ${JSON.stringify(delegatorVotes)}`);


      // GET /governance/dreps/{drep_id}/votes
      // Get the vote of the DRep for that proposal using Blockfrost API
      const url = `https://cardano-mainnet.blockfrost.io/api/v0/governance/dreps/${drep_id}/votes`;
      const options = {method: 'GET', headers: {Project_id: 'mainnetH33gpqGTjsLKdcSNQmGCBiiieWsKIkoO'}};

      const response = await fetch(url, options);
      const drepVotes = await response.json();
      console.log(`DRep Votes: ${drepVotes}`);
      const drepVotesString = JSON.stringify(drepVotes);
      console.log(`DRep Votes: ${drepVotesString}`);


      let drepVoteResult = -1;

      // The drepVotes has the tx_hash of the vote, not the proposal.
      for (let vote of drepVotes) {
        const vote_tx_hash = vote.tx_hash;
        const getTxUrl = `https://api.cardanoscan.io/api/v1/transaction?hash=${vote_tx_hash}`;
        const headers = {
          apiKey: '28917240-ce05-4a67-9f90-b6d1e9d8cad5'
        };

        const txResponse = await fetch(getTxUrl, { headers });
        const txData = await txResponse.json();
        console.log(`Transaction data of the DRep vote transaction: ${JSON.stringify(txData)}`);

        // Get data.votingProcedures[0].votes.actionId:
        const action_id = txData.votingProcedures[0].votes[0].actionId;
        console.log(`Action ID / Proposal TX Hash: ${action_id}`);
        console.log(`Comparing ${action_id} with ${proposal_tx_hash}`);

        // Remove the last 2 characters from the action_id so it matches the proposal_tx_hash length (64)
        const clean_action_id = action_id.slice(0, -2);

        // Compare the action_id with the proposal_tx_hash
        if (clean_action_id === proposal_tx_hash) {
          console.log("Encontramos el voto del DREP para la propuesta.")
          console.log(txData);
          drepVoteResult = txData.votingProcedures[0].votes[0].vote;
          break;
      }
    }

      let drepVoteResultString = 'Did not vote';
      if (drepVoteResult === 0) {
        drepVoteResultString = 'No';
      } else if (drepVoteResult === 1) {
        drepVoteResultString = 'Yes';
      } else if (drepVoteResult === 2) {
        drepVoteResultString = 'Abstain';
      }
        

      setSearchPerformed(true)
      setVotingResults({
        delegatorVotes: delegatorVotes,
        drepVote: drepVoteResultString
      })
    }

    const delegateFunc = async () => {
      const blockchainProvider = new BlockfrostProvider('mainnetH33gpqGTjsLKdcSNQmGCBiiieWsKIkoO');
      // 'mainnetH33gpqGTjsLKdcSNQmGCBiiieWsKIkoO'
      // 'preprodZHwbgkKCMyH7DuWz87Ya9lWHMqrlfJBM'

      const txBuilder = new MeshTxBuilder({
        fetcher: blockchainProvider,
        evaluator: blockchainProvider,
        verbose: true,
      });

      //txBuilder.setNetwork("preprod")

      const utxos = await wallet.getUtxos();
      const rewardAddresses = await wallet.getRewardAddresses();
      const rewardAddress = rewardAddresses[0];
      const changeAddress = await wallet.getChangeAddress();
      console.log(changeAddress)
      const assetMap = new Map<Unit, Quantity>();
      assetMap.set("lovelace", "5000000");
      const selectedUtxos = keepRelevant(assetMap, utxos);

      for (const utxo of selectedUtxos) {
        txBuilder.txIn(
          utxo.input.txHash,
          utxo.input.outputIndex,
          utxo.output.amount,
          utxo.output.address,
        );
      }

      console.log(selectedDRep)

      txBuilder
        .voteDelegationCertificate(
          {
            dRepId: selectedDRep,
          },
          rewardAddress,
        )
        .changeAddress(changeAddress);

      const unsignedTx = await txBuilder.complete();
      const signedTx = await wallet.signTx(unsignedTx);
      const txHash = await wallet.submitTx(signedTx);
    }    

    const handleClear = () => {
        // Clear the Drep and proposal inputs.
        setDrepInput("");
        setProposalInput("");
        setSelectedDRep("");
        setSelectedProposal("");
        // Also clear what's below the form (the votes)
        setSearchPerformed(false);
        setVotingResults(null);
    }
  
    if (error) {
      return <div>Error: {error}</div>;
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
                    <button onClick={() => navigateTo('/cardanoproposals')}>Vote</button>
                </li>
                <li>
                    <button onClick={() => navigateTo('/DReps')}>See DReps</button>
                </li>
            </ul>
        </nav>
    </header>
      <div className={styles.container}>
        <div className={styles.title}>
            <h1>DRep votes statistics</h1>
        </div>
        <div className={styles.card}>
        <div className={styles.cardContents}>
          <div className={styles.cardHeader}>
            <h3>Search for DRep and Proposal</h3>
            <p>Discover whether DReps votes align with the views of their delegators.</p>
          </div>
  
          <div className={styles.inputGroup}>
            <label htmlFor="drep-select" className={styles.label}>Choose DRep</label>
            <div className={styles.selectContainer} ref={drepRef}>
              <input
                id="drep-select"
                type="text"
                className={styles.select}
                value={drepInput}
                onChange={(e) => setDrepInput(e.target.value)}
                onFocus={handleDrepSelect}
                placeholder="Enter drep_id"
              />
              {showDrepDropdown && (
                <ul className={styles.dropdown}>
                  {filteredDreps.map((drep) => (
                    <li
                      key={drep.drep_id}
                      className={styles.dropdownItem}
                      onClick={() => {
                        setSelectedDRep(drep.drep_id)
                        setDrepInput(drep.drep_id)
                        setShowDrepDropdown(false)
                      }}
                    >
                      {drep.drep_id}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
  
          <div className={styles.inputGroup}>
            <label htmlFor="proposal-select" className={styles.label}>Choose proposal</label>
            <div className={styles.selectContainer} ref={proposalRef}>
              <input
                id="proposal-select"
                type="text"
                className={styles.select}
                value={proposalInput}
                onChange={(e) => setProposalInput(e.target.value)}
                onFocus={handleProposalSelect}
                placeholder="Enter proposal tx Hash"
              />
              {showProposalDropdown && (
                <ul className={styles.dropdown}>
                  {filteredProposals.map((proposal) => (
                    <li
                      key={proposal.tx_hash}
                      className={styles.dropdownItem}
                      onClick={() => {
                        setSelectedProposal(proposal.tx_hash)
                        setProposalInput(proposal.tx_hash)
                        setShowProposalDropdown(false)
                      }}
                    >
                      {proposal.tx_hash}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
  
          <div className={styles.searchDiv}>
          <button 
            className={styles.searchButton} 
            onClick={handleSearch}
            disabled={!selectedDRep || !selectedProposal}
          >
            Search
          </button>
          <button 
            className={styles.clearButton} 
            onClick={handleClear}
          >
            Clear Inputs
          </button>
          </div>
  
          {searchPerformed && votingResults && (
            <div className={styles.results}>
              <div className={styles.delegatorVotes}>
                <span className={`${styles.label} ${styles.votes}`}>Delegators votes:</span>
                <div className={styles.voteBoxes}>
                  <div className={`${styles.voteBox} ${styles.green}`}>{votingResults.delegatorVotes.yes}</div>
                  <div className={`${styles.voteBox} ${styles.pink}`}>{votingResults.delegatorVotes.no}</div>
                  <div className={`${styles.voteBox} ${styles.yellow}`}>{votingResults.delegatorVotes.abstain}</div>
                </div>
              </div>
              <div className={styles.drepVote}>
                <span className={`${styles.label} ${styles.votes}`}>DRep vote:</span>
                <div className={styles.voteResult}>{votingResults.drepVote}</div>
              </div>
            </div>
          )}
        </div>
        </div>
        <div className={styles.connectWalletContainer}>
          <div className={styles.connectWallet}>
            <h2>Would you like to delegate to the selected DRep?</h2>
            <div className={styles.cardanoWallet}>
            <CardanoWallet />
            </div>
          </div>
          {connected && (
          <>
            <button 
              className={styles.searchButton} 
              onClick={delegateFunc}
              disabled={!selectedDRep}
            >
            Delegate
            </button>
            {!selectedDRep && (
              <p className={styles.error}>Please select a DRep to delegate to.</p>
            )}
          </>
          )}

          </div>
        </div>
    </>)
  };



export const getServerSideProps = async () => {
  try {
    const response = await fetch('https://cardano-mainnet.blockfrost.io/api/v0/governance/dreps', {
        headers: {
          Project_id: 'mainnetH33gpqGTjsLKdcSNQmGCBiiieWsKIkoO'
        }
      })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // console.log("AAA.")
    // console.log(data);

    const responseProposals = await fetch('https://cardano-mainnet.blockfrost.io/api/v0/governance/proposals', {
        headers: {
          Project_id: 'mainnetH33gpqGTjsLKdcSNQmGCBiiieWsKIkoO'
        }
    })
    
    const proposals = await responseProposals.json();
    // console.log("BBB.")
    // console.log(proposals);


    return { props: { dreps: data, proposals: proposals } };
  } catch (error) {
    return { props: { dreps: null, error: error.message } };
  }
};

export default DRepsPage;


//   const getDelegators = async () => {
//     for (let drep of dreps) {
//         const delegators = await getDelegatorsOf(drep.drep_id);
//         setDelegator(prevState => ({
//             ...prevState,
//             [drep.drep_id]: delegators
//         }));
//     }
//   }

// const allDelegators = [];

// for (let drep of data) {
//     const delegators = await getDelegatorsOf(drep.drep_id);
//     allDelegators[drep.drep_id] = delegators;
//     console.log(`Added delegators of DREP ${drep.drep_id}. It has ${delegators.length} delegators assigned`)
// }



//   const getDelegatorsOf = async (drep_id: string) => {
//     try{
//         const response = await fetch(`https://cardano-mainnet.blockfrost.io/api/v0/governance/dreps/${drep_id}/delegators`, {
//             headers: {
//             Project_id: 'mainnetH33gpqGTjsLKdcSNQmGCBiiieWsKIkoO'
//             }
//         })

//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
      
//         const data = await response.json();
//         console.log(data);
//     } catch (err) {
//         console.error('Falló la búsqueda de los delegators del DREP: ' + drep_id)
//     }
//   }

// const getVotesOf = (drep_id: string) => {

// }