import { useState } from "react";
import type { NextPage } from "next";
import { useWallet } from '@meshsdk/react';
import { CardanoWallet } from '@meshsdk/react';
import styles from './RadioInput.module.css';
import { mockDatabase } from "../data.ts";
import fs from "fs";
import path from "path";

type VotingRecord = {
  wallet_address: string; // billetera
  proposal_tx_hash: string;  // propuesta
  vote: string; // voto
};



const ProposalsPage = ({ proposals, error, children }) => {

  const { connected, wallet } = useWallet();
  const [assets, setAssets] = useState<null | any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [selectedOption, setSelectedOption] = useState<Record<string, string>>({});


/*

  const handleSubmit = (tx_hash: string, event: React.FormEvent) => {
      event.preventDefault();
      const objeto =  { wallet_address: "pruebadewallet", proposal_tx_hash: tx_hash, vote: selectedOption[tx_hash] }
      console.log(tx_hash, selectedOption[tx_hash])
      mockDatabase.push(objeto);
      console.log(mockDatabase); 
      // fs.writeFileSync("../data.ts", JSON.stringify(mockDatabase, null, 2) , 'utf-8');

      // mandar a la api
  };

*/

  const handleSubmit = async (tx_hash: string, event: React.FormEvent) => {
    event.preventDefault()
    try {
      const objeto =  { wallet_address: "pruebadewallet", proposal_tx_hash: tx_hash, vote: selectedOption[tx_hash] }
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

    <div>
      <h1>Cardano Governance Proposals</h1>
      {proposals && proposals.length > 0 ? (
        <ul>
          {proposals.map((proposal) => (
            <li key={proposal.tx_hash}>
              <h2>{proposal.title}</h2>
              <p><strong>ID:</strong> {proposal.tx_hash}</p>
              <a href={`https://cardanoscan.io/transaction/${proposal.tx_hash}?tab=govActions`}>Link to cardanoscan</a>
              <form onSubmit={(e) => handleSubmit(proposal.tx_hash, e)} className={styles.form}>
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
        </form>
            </li>
          ))}
        </ul>
      ) : (
        <p>No proposals found.</p>
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
