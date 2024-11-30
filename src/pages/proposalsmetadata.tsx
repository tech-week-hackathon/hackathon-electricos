import React from 'react';

const ProposalsMetadataPage = ({ proposals, error }) => {
  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
  	<div>	
              <p><strong>Hash:</strong> {proposals.tx_hash}</p>
              <p><strong>Title:</strong> {proposals.json_metadata.body.title}</p>
              <p><strong>Abstract:</strong> {proposals.json_metadata.body.abstract}</p>
</div> 
 )
 }

export const getServerSideProps = async () => {
  const url = 'https://cardano-mainnet.blockfrost.io/api/v0/governance/proposals/fff0df644d328a5367212f45bab59060bde3c4091dc96c723062896fd6197314/0/metadata';
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

export default ProposalsMetadataPage;
