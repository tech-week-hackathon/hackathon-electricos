import React from 'react';

// Add this interface before the component
interface Proposal {
  tx_hash: string;
  details: {
    json_metadata: {
        body?: {
            title: string;
            abstract: string;
            rationale: string;
            motivation: string;
        }
    };
  };
}

interface Props {
  proposals: Proposal[];
}

const Prueba = ({ proposals }: Props) => {
    //console.log("Full proposals data:", JSON.stringify(proposals, null, 2));
    //console.log("First proposal details:", proposals[0]);
    
    return (
        <>  
            {proposals && proposals.length > 0 ? (
                <ul> 
                    {proposals.map((proposal) => (
                        <li key={proposal.tx_hash}>
                            {JSON.stringify(proposal.details.json_metadata) && (
                                <h1>{JSON.stringify(proposal.details.json_metadata.body?.title)}</h1>
                            )}
                            {JSON.stringify(proposal.details.json_metadata) && (
                                <h1>{JSON.stringify(proposal.details.json_metadata.body?.abstract)}</h1>
                            )}
                            {JSON.stringify(proposal.details.json_metadata) && (
                                <h4>{JSON.stringify(proposal.details.json_metadata.body?.rationale)}</h4>
                            )}
                            {JSON.stringify(proposal.details.json_metadata) && (
                                <h4>{JSON.stringify(proposal.details.json_metadata.body?.motivation)}</h4>
                            )}
                        {proposal.tx_hash}
                        </li>
                    ))}
                </ul>
            ) : (
                <h1>Todo mal</h1>
            )}
        </>
    )
}


export async function getServerSideProps() {
  const baseUrl = 'https://cardano-mainnet.blockfrost.io/api/v0/governance/proposals';
  const headers = {
    'Accept': 'application/json',
    'project_id': 'mainnetH33gpqGTjsLKdcSNQmGCBiiieWsKIkoO',
  };

  try {
    // First fetch all proposals
    const response = await fetch(baseUrl, {
      headers: headers,
    });
    const proposals = await response.json();

    // Then fetch details for each proposal
    const proposalsWithDetails = await Promise.all(
      proposals.map(async (proposal: Proposal) => {
        const detailResponse = await fetch(
          `${baseUrl}/${proposal.tx_hash}/0/metadata`,
          { headers }
        );
        const details = await detailResponse.json();
        return { ...proposal, details };
      })
    );

    return {
      props: {
        proposals: proposalsWithDetails,
      },
    };
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return {
      props: {
        proposals: [],
      },
    };
  }
}

export default Prueba;
