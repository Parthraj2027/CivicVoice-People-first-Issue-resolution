import React from 'react';
import '@/components/library/Library.css';

const KarmaScore = ({ score = 0, badges = [] }) => {
  const progress = Math.min(100, Math.round((score % 100) || 0));
  return (
    <section className="cv-karma">
      <header>
        <h3>Karma Score</h3>
        <strong>{score}</strong>
      </header>
      <div className="bar" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <p>{100 - progress} points to next badge milestone</p>
      <div className="badges">
        {badges.length === 0 ? <span className="badge">No badges yet</span> : badges.map((badge) => <span key={badge} className="badge">{badge}</span>)}
      </div>
    </section>
  );
};

export default KarmaScore;
