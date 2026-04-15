import React from 'react';
import '@/components/library/Library.css';

const UrgencyBadge = ({ level = 'low' }) => {
  const normalized = ['low', 'medium', 'high', 'emergency'].includes(level) ? level : 'low';
  return <span className={`cv-urgency-badge ${normalized}`}>{normalized.replace('_', ' ')}</span>;
};

export default UrgencyBadge;
