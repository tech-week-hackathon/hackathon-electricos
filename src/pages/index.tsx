import { useState } from "react";
import type { NextPage } from "next";
import { useWallet } from '@meshsdk/react';
import { CardanoWallet } from '@meshsdk/react';
import { useRouter } from 'next/router';
import styles from './Home.module.css';

const Home: NextPage = () => {
  const router = useRouter()

  const navigateTo = (path: string) => {
    router.push(path)
  }

  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <h1 className={styles.title}>Welcome</h1>
        
        <div className={styles.sections}>
          <section className={styles.section}>
            <h2>Vote</h2>
            <p>
              Let your DRep know your opinion.
              Tell us how you would vote to
              each proposal.
            </p>
            <button 
              onClick={() => navigateTo('/cardanoproposals')}
              className={styles.button}
            >
              Go to Vote
            </button>
          </section>

          <div className={styles.divider}></div>

          <section className={styles.section}>
            <h2>See DReps</h2>
            <p>
              See if your (and any other) DRep
              is following their delegators&apos;
              advice. Let&apos;s hold them accountable.
            </p>
            <button 
              onClick={() => navigateTo('/DReps')}
              className={styles.button}
            >
              View DRep Votes
            </button>
          </section>
        </div>
      </div>
    </main>
  )
};

export default Home;