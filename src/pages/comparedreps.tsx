import { useState, useEffect, useRef } from 'react'
import { useWallet } from '@meshsdk/react'
import styles from '../styles/CompareReps.module.css'
import { BlockfrostProvider, MeshTxBuilder } from "@meshsdk/core"
import { keepRelevant } from '@meshsdk/core'

const navigateTo = (path: string) => {
  window.location ? window.location.assign(path) : null
}

const CompareRepsPage = ({ dreps, proposals, error }) => {
  const { connected, wallet } = useWallet()
  const [selectedDRep1, setSelectedDRep1] = useState("")
  const [selectedDRep2, setSelectedDRep2] = useState("")
  const [selectedProposal, setSelectedProposal] = useState("")
  const [drepInput1, setDrepInput1] = useState("")
  const [drepInput2, setDrepInput2] = useState("")
  const [proposalInput, setProposalInput] = useState("")
  const [showDrepDropdown1, setShowDrepDropdown1] = useState(false)
  const [showDrepDropdown2, setShowDrepDropdown2] = useState(false)
  const [showProposalDropdown, setShowProposalDropdown] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [votingResults1, setVotingResults1] = useState(null)
  const [votingResults2, setVotingResults2] = useState(null)
  
  const drepRef1 = useRef<HTMLDivElement>(null)
  const drepRef2 = useRef<HTMLDivElement>(null)
  const proposalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drepRef1.current && !drepRef1.current.contains(event.target as Node)) {
        setShowDrepDropdown1(false)
      }
      if (drepRef2.current && !drepRef2.current.contains(event.target as Node)) {
        setShowDrepDropdown2(false)
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

  const getFilteredDreps = (input: string) => {
    const startsWithInput = dreps.filter(drep => drep.drep_id.toLowerCase().startsWith(input.toLowerCase()))
    const uniqueMap = new Map()

    startsWithInput.forEach(item => {
      if (!uniqueMap.has(item.drep_id)) {
        uniqueMap.set(item.drep_id, item)
      }
    })
  
    return Array.from(uniqueMap.values())
  }
    
  const filteredDreps1 = getFilteredDreps(drepInput1)
  const filteredDreps2 = getFilteredDreps(drepInput2)
  
  const getFilteredProposals = () => {
    const startsWithInput = proposals.filter(p => p.tx_hash.toLowerCase().startsWith(proposalInput.toLowerCase()))
    const uniqueMap = new Map()
  
    startsWithInput.forEach(item => {
      if (!uniqueMap.has(item.tx_hash)) {
        uniqueMap.set(item.tx_hash, item)
      }
    })
  
    return Array.from(uniqueMap.values())
  }

  const filteredProposals = getFilteredProposals()

  const handleDrepSelect1 = () => {
    setShowDrepDropdown1(true)
  }

  const handleDrepSelect2 = () => {
    setShowDrepDropdown2(true)
  }

  const handleProposalSelect = () => {
    setShowProposalDropdown(true)
  }

  const getDelegatorsOf = async (drep_id: string) => {
    try {
      const response = await fetch(`https://cardano-mainnet.blockfrost.io/api/v0/governance/dreps/${drep_id}/delegators`, {
        headers: {
          Project_id: 'mainnetH33gpqGTjsLKdcSNQmGCBiiieWsKIkoO'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    
      const data = await response.json()
      console.log(`Delegators of Drep ${drep_id}: ${JSON.stringify(data)}`)
      return data
    } catch (err) {
      console.error('Failed to fetch delegators for DREP: ' + drep_id)
    }
  }

  const getVotesOfDelegators = async (delegators: Object[], proposal_tx_hash: string) => {
    const response = await fetch('/api/getVotes')
    const data = await response.json()
    
    console.log(`ALL VOTES: ${JSON.stringify(data)}`)

    const proposalVotes = data.filter(vote => vote.proposal_tx_hash === proposal_tx_hash)
    console.log(`ONLY VOTES OF THIS PROPOSAL: ${JSON.stringify(proposalVotes)}`)
    console.log(`DELEGATORS: ${JSON.stringify(delegators)}`)

    const listOfDelegatorsWalletAddresses = delegators.map(delegator => delegator.address)
    console.log(`LIST OF WALLET ADDRESSES OF DELEGATORS: ${JSON.stringify(listOfDelegatorsWalletAddresses)}`)

    const delegatorVotes1 = proposalVotes.filter(vote => listOfDelegatorsWalletAddresses.includes(vote.wallet_address))

    console.log(`ONLY VOTES OF THIS DREP DELEGATORS: ${JSON.stringify(delegatorVotes1)}`)

    const yesVotes = delegatorVotes1.filter(vote => vote.vote === "yes")
    const noVotes = delegatorVotes1.filter(vote => vote.vote === "no")
    const abstainVotes = delegatorVotes1.filter(vote => vote.vote === "abstain")

    let delegatorVotes = {"yes": yesVotes.length, "no": noVotes.length, "abstain": abstainVotes.length}

    return delegatorVotes
  }

  const handleSearch = async () => {
    const fetchDRepResults = async (drepId: string) => {
      const delegators = await getDelegatorsOf(drepId)
      const delegatorVotes = await getVotesOfDelegators(delegators, selectedProposal)

      const url = `https://cardano-mainnet.blockfrost.io/api/v0/governance/dreps/${drepId}/votes`
      const options = {method: 'GET', headers: {Project_id: 'mainnetH33gpqGTjsLKdcSNQmGCBiiieWsKIkoO'}}

      const response = await fetch(url, options)
      const drepVotes = await response.json()

      let drepVoteResult = -1

      for (let vote of drepVotes) {
        const vote_tx_hash = vote.tx_hash
        const getTxUrl = `https://api.cardanoscan.io/api/v1/transaction?hash=${vote_tx_hash}`
        const headers = {
          apiKey: '28917240-ce05-4a67-9f90-b6d1e9d8cad5'
        }

        const txResponse = await fetch(getTxUrl, { headers })
        const txData = await txResponse.json()

        const action_id = txData.votingProcedures[0].votes[0].actionId
        const clean_action_id = action_id.slice(0, -2)

        if (clean_action_id === selectedProposal) {
          drepVoteResult = txData.votingProcedures[0].votes[0].vote
          break
        }
      }

      let drepVoteResultString = 'Did not vote'
      if (drepVoteResult === 0) {
        drepVoteResultString = 'No'
      } else if (drepVoteResult === 1) {
        drepVoteResultString = 'Yes'
      } else if (drepVoteResult === 2) {
        drepVoteResultString = 'Abstain'
      }

      return {
        delegatorVotes: delegatorVotes,
        drepVote: drepVoteResultString
      }
    }

    const results1 = await fetchDRepResults(selectedDRep1)
    const results2 = await fetchDRepResults(selectedDRep2)

    setSearchPerformed(true)
    setVotingResults1(results1)
    setVotingResults2(results2)
  }

  const delegateFunc = async (drepId: string) => {
    const blockchainProvider = new BlockfrostProvider('mainnetH33gpqGTjsLKdcSNQmGCBiiieWsKIkoO')

    const txBuilder = new MeshTxBuilder({
      fetcher: blockchainProvider,
      evaluator: blockchainProvider,
      verbose: true,
    })

    const utxos = await wallet.getUtxos()
    const rewardAddresses = await wallet.getRewardAddresses()
    const rewardAddress = rewardAddresses[0]
    const changeAddress = await wallet.getChangeAddress()
    console.log(changeAddress)
    const assetMap = new Map<Unit, Quantity>()
    assetMap.set("lovelace", "5000000")
    const selectedUtxos = keepRelevant(assetMap, utxos)

    for (const utxo of selectedUtxos) {
      txBuilder.txIn(
        utxo.input.txHash,
        utxo.input.outputIndex,
        utxo.output.amount,
        utxo.output.address,
      )
    }

    txBuilder
      .voteDelegationCertificate(
        {
          dRepId: drepId,
        },
        rewardAddress,
      )
      .changeAddress(changeAddress)

    const unsignedTx = await txBuilder.complete()
    const signedTx = await wallet.signTx(unsignedTx)
    const txHash = await wallet.submitTx(signedTx)
  }    

  const handleClear = () => {
    setDrepInput1("")
    setDrepInput2("")
    setProposalInput("")
    setSelectedDRep1("")
    setSelectedDRep2("")
    setSelectedProposal("")
    setSearchPerformed(false)
    setVotingResults1(null)
    setVotingResults2(null)
  }

  if (error) {
    return <div>Error: {error}</div>
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
      <div className={styles.container}>
        <div className={styles.title}>
          <h1>Compare DReps</h1>
          <p>See how different DReps voted each proposal.</p>
        </div>
        <div className={styles.compareContainer}>
          <div className={styles.card}>
            <div className={styles.cardContents}>
              <div className={styles.cardHeader}>
                <h3>DRep 1</h3>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="drep-select-1" className={styles.label}>Choose DRep 1</label>
                <div className={styles.selectContainer} ref={drepRef1}>
                  <input
                    id="drep-select-1"
                    type="text"
                    className={styles.select}
                    value={drepInput1}
                    onChange={(e) => setDrepInput1(e.target.value)}
                    onFocus={handleDrepSelect1}
                    placeholder="Enter drep_id"
                  />
                  {showDrepDropdown1 && (
                    <ul className={styles.dropdown}>
                      {filteredDreps1.map((drep) => (
                        <li
                          key={drep.drep_id}
                          className={styles.dropdownItem}
                          onClick={() => {
                            setSelectedDRep1(drep.drep_id)
                            setDrepInput1(drep.drep_id)
                            setShowDrepDropdown1(false)
                          }}
                        >
                          {drep.drep_id}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              {searchPerformed && votingResults1 && (
                <div className={styles.results}>
                  <div className={styles.delegatorVotes}>
                    <span className={`${styles.label} ${styles.votes}`}>Delegators votes:</span>
                    <div className={styles.voteBoxes}>
                      <div className={`${styles.voteBox} ${styles.green}`}>{votingResults1.delegatorVotes.yes}</div>
                      <div className={`${styles.voteBox} ${styles.pink}`}>{votingResults1.delegatorVotes.no}</div>
                      <div className={`${styles.voteBox} ${styles.yellow}`}>{votingResults1.delegatorVotes.abstain}</div>
                    </div>
                  </div>
                  <div className={styles.drepVote}>
                    <span className={`${styles.label} ${styles.votes}`}>DRep vote:</span>
                    <div className={styles.voteResult}>{votingResults1.drepVote}</div>
                  </div>
                </div>
              )}
              {/* {connected && (
                <button 
                  className={styles.delegateButton} 
                  onClick={() => delegateFunc(selectedDRep1)}
                  disabled={!selectedDRep1}
                >
                  Delegate to DRep 1
                </button>
              )} */}
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardContents}>
              <div className={styles.cardHeader}>
                <h3>DRep 2</h3>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="drep-select-2" className={styles.label}>Choose DRep 2</label>
                <div className={styles.selectContainer} ref={drepRef2}>
                  <input
                    id="drep-select-2"
                    type="text"
                    className={styles.select}
                    value={drepInput2}
                    onChange={(e) => setDrepInput2(e.target.value)}
                    onFocus={handleDrepSelect2}
                    placeholder="Enter drep_id"
                  />
                  {showDrepDropdown2 && (
                    <ul className={styles.dropdown}>
                      {filteredDreps2.map((drep) => (
                        <li
                          key={drep.drep_id}
                          className={styles.dropdownItem}
                          onClick={() => {
                            setSelectedDRep2(drep.drep_id)
                            setDrepInput2(drep.drep_id)
                            setShowDrepDropdown2(false)
                          }}
                        >
                          {drep.drep_id}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              {searchPerformed && votingResults2 && (
                <div className={styles.results}>
                  <div className={styles.delegatorVotes}>
                    <span className={`${styles.label} ${styles.votes}`}>Delegators votes:</span>
                    <div className={styles.voteBoxes}>
                      <div className={`${styles.voteBox} ${styles.green}`}>{votingResults2.delegatorVotes.yes}</div>
                      <div className={`${styles.voteBox} ${styles.pink}`}>{votingResults2.delegatorVotes.no}</div>
                      <div className={`${styles.voteBox} ${styles.yellow}`}>{votingResults2.delegatorVotes.abstain}</div>
                    </div>
                  </div>
                  <div className={styles.drepVote}>
                    <span className={`${styles.label} ${styles.votes}`}>DRep vote:</span>
                    <div className={styles.voteResult}>{votingResults2.drepVote}</div>
                  </div>
                </div>
              )}
              {/* {connected && (
                <button 
                  className={styles.delegateButton} 
                  onClick={() => delegateFunc(selectedDRep2)}
                  disabled={!selectedDRep2}
                >
                  Delegate to DRep 2
                </button>
              )} */}
            </div>
          </div>
        </div>
        <div className={styles.proposalSection}>
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
              disabled={!selectedDRep1 || !selectedDRep2 || !selectedProposal}
            >
              Compare
            </button>
            <button 
              className={styles.clearButton} 
              onClick={handleClear}
            >
              Clear Inputs
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export const getServerSideProps = async () => {
  try {
    const response = await fetch('https://cardano-mainnet.blockfrost.io/api/v0/governance/dreps', {
      headers: {
        Project_id: 'mainnetH33gpqGTjsLKdcSNQmGCBiiieWsKIkoO'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    const responseProposals = await fetch('https://cardano-mainnet.blockfrost.io/api/v0/governance/proposals', {
      headers: {
        Project_id: 'mainnetH33gpqGTjsLKdcSNQmGCBiiieWsKIkoO'
      }
    })
    
    const proposals = await responseProposals.json()

    return { props: { dreps: data, proposals: proposals } }
  } catch (error) {
    return { props: { dreps: null, error: error.message } }
  }
}

export default CompareRepsPage;
