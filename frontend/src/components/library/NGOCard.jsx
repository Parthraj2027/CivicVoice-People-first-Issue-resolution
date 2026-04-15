import React from 'react';
import { BadgeCheck, Clock3, MapPin } from 'lucide-react';
import '@/components/library/Library.css';

const NGOCard = ({ ngo, variant = 'directory', onOpen }) => {
  const areas = (ngo?.serviceAreas || []).map((area) => area.city).filter(Boolean).slice(0, 2).join(', ');

  return (
    <article className={`cv-ngo-card ${variant}`}>
      <div className="cv-ngo-head">
        <div className="logo">{(ngo?.name || 'N').slice(0, 1)}</div>
        <div>
          <h3>{ngo?.name || 'NGO Partner'}</h3>
          <p>{ngo?.description || 'Social support partner'}</p>
        </div>
      </div>
      <div className="cv-ngo-meta">
        <span><BadgeCheck size={14} /> {ngo?.isVerified ? 'Verified' : 'Pending review'}</span>
        <span><Clock3 size={14} /> Avg response {ngo?.responseTimeAvg || 0} min</span>
        <span><MapPin size={14} /> {areas || 'Multiple regions'}</span>
      </div>
      <button type="button" onClick={onOpen}>Open profile</button>
    </article>
  );
};

export default NGOCard;
