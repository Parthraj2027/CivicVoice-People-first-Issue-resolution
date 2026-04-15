import React from 'react';
import { MapPin, Clock3, ArrowUp } from 'lucide-react';
import UrgencyBadge from '@/components/library/UrgencyBadge';
import '@/components/library/Library.css';

const IssueCard = ({ issue, variant = 'civic', onUpvote, onOpen }) => {
  const type = issue?.issueTrack || issue?.issueType || variant;
  const title = issue?.title || issue?.issueType || 'Issue report';
  const location = typeof issue?.location === 'string'
    ? issue.location
    : [issue?.location?.address, issue?.location?.city, issue?.location?.state].filter(Boolean).join(', ') || 'Location not provided';

  return (
    <article className={`cv-issue-card ${type === 'social' ? 'social' : 'civic'}`}>
      <div className="cv-issue-card-top">
        <span className="cv-track-pill">{type}</span>
        <UrgencyBadge level={issue?.urgencyLevel || issue?.severity || 'low'} />
      </div>

      <h3>{title}</h3>
      <p>{issue?.summary || issue?.description || 'No description available.'}</p>

      <div className="cv-issue-meta">
        <span><MapPin size={14} /> {location}</span>
        <span><Clock3 size={14} /> {issue?.status || 'submitted'}</span>
      </div>

      <div className="cv-issue-actions">
        <button type="button" onClick={onOpen}>Track</button>
        <button type="button" className="ghost" onClick={onUpvote}>
          <ArrowUp size={14} /> {issue?.communityUpvotes || 0}
        </button>
      </div>
    </article>
  );
};

export default IssueCard;
