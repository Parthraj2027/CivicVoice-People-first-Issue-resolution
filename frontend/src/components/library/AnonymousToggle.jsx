import React from 'react';
import '@/components/library/Library.css';

const AnonymousToggle = ({ value, onChange }) => {
  return (
    <label className="cv-anon-toggle">
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span className="switch" aria-hidden="true" />
      <span className="text">Report anonymously - your identity will not be shared.</span>
    </label>
  );
};

export default AnonymousToggle;
