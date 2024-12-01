import { useWallet } from '@meshsdk/react';
import { CardanoWallet } from '@meshsdk/react';
import { useState, useEffect, useRef } from 'react'
import styles from './DReps.module.css'

// En dreps tenemos una lista de dreps.
// Cada drep consiste de un drep_id y de un hex.

// En base a cada drep, tenemos que encontrar:
//    - sus votos
//    - sus delegators
const DRepsPage = ({ dreps, proposals, error }) => {
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
  
    const handleSearch = async () => {
      // Here you would typically fetch the voting results based on selectedDRep and selectedProposal
      // For this example, we'll use mock data
      setSearchPerformed(true)
      setVotingResults({
        delegatorVotes: { yes: 6, no: 1, abstain: 0 },
        drepVote: 'yes'
      })
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
      <div className={styles.container}>
        <div className={styles.card}>
            <div className={styles.cardContents}>
          <h1 className={styles.title}>How do DReps Vote</h1>
  
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
                <span className={styles.label}>Delegators voted:</span>
                <div className={styles.voteBoxes}>
                  <div className={`${styles.voteBox} ${styles.green}`}>{votingResults.delegatorVotes.yes}</div>
                  <div className={`${styles.voteBox} ${styles.pink}`}>{votingResults.delegatorVotes.no}</div>
                  <div className={`${styles.voteBox} ${styles.yellow}`}>{votingResults.delegatorVotes.abstain}</div>
                </div>
              </div>
              <div className={styles.drepVote}>
                <span className={styles.label}>DRep voted:</span>
                <div className={styles.voteResult}>{votingResults.drepVote}</div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    )
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