import React from 'react';
import { Siren, X } from 'lucide-react';
import '@/components/library/Library.css';

const EmergencyAlert = ({ message, helplines = [], onDismiss }) => {
  return (
    <div className="cv-emergency-alert" role="alert" aria-live="assertive">
      <div>
        <strong><Siren size={16} /> Emergency response triggered</strong>
        <p>{message}</p>
        {helplines.length > 0 ? <small>Helplines: {helplines.join(', ')}</small> : null}
      </div>
      {onDismiss ? (
        <button type="button" onClick={onDismiss} aria-label="Dismiss emergency alert">
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
};

export default EmergencyAlert;
