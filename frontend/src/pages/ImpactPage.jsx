import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPublicImpact } from '@/features/community/communitySlice';
import '@/styles/ImpactPage.css';

const ImpactPage = () => {
  const dispatch = useDispatch();
  const { impact } = useSelector((state) => state.community);

  useEffect(() => {
    dispatch(fetchPublicImpact());
  }, [dispatch]);

  return (
    <div className="impact-page">
      <h1>Public Impact</h1>
      <p>Live civic + social issue outcomes across the platform.</p>

      <section className="impact-grid">
        <article><strong>{impact?.resolvedTotal || 0}</strong><span>Issues resolved</span></article>
        <article><strong>{impact?.civicResolved || 0}</strong><span>Civic resolved</span></article>
        <article><strong>{impact?.socialResolved || 0}</strong><span>Social resolved</span></article>
        <article><strong>{impact?.ngosActive || 0}</strong><span>Active NGOs</span></article>
      </section>
    </div>
  );
};

export default ImpactPage;
