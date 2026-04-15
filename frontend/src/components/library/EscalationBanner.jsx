import React from 'react';
import { AlertTriangle, Timer } from 'lucide-react';
import '@/components/library/Library.css';

const EscalationBanner = ({ fromEntity, toEntity, reason, countdown = '24h' }) => {
  return (
    <div className="cv-escalation-banner" role="status" aria-live="polite">
      <div>
        <strong><AlertTriangle size={16} /> Escalation watch</strong>
        <p>{fromEntity || 'NGO'} to {toEntity || 'Department'} - {reason || 'Awaiting update'}</p>
      </div>
      <span><Timer size={14} /> {countdown}</span>
    </div>
  );
};

export default EscalationBanner;
