import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Share2, ThumbsUp } from 'lucide-react';
import api from '@/lib/apiClient';
import ProgressTimeline from '@/components/library/ProgressTimeline';
import UrgencyBadge from '@/components/library/UrgencyBadge';
import EmergencyAlert from '@/components/library/EmergencyAlert';
import EscalationBanner from '@/components/library/EscalationBanner';
import '@/styles/IssueTrackerPage.css';

const stagesTemplate = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'reviewing', label: 'Under Review' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'escalated', label: 'Escalated' },
  { key: 'closed', label: 'Closed' },
];

const statusAlias = {
  pending: 'submitted',
  in_review: 'reviewing',
  forwarded: 'assigned',
  completed: 'resolved',
  reopened: 'in_progress',
};

const IssueTrackerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [witness, setWitness] = useState('');

  useEffect(() => {
    const loadIssue = async () => {
      setLoading(true);
      setError('');
      try {
        const civicResponse = await api.get(`/issues/${id}`);
        setIssue(civicResponse.data);
      } catch {
        try {
          const socialResponse = await api.get(`/social-issues/${id}`);
          setIssue(socialResponse.data);
        } catch (err) {
          setError(err.response?.data?.message || 'Issue not found');
        }
      } finally {
        setLoading(false);
      }
    };

    loadIssue();
  }, [id]);

  const timelineStages = useMemo(() => {
    const current = statusAlias[issue?.status] || issue?.status || 'submitted';
    const currentIndex = stagesTemplate.findIndex((item) => item.key === current);
    return {
      list: stagesTemplate.map((stage) => ({
        ...stage,
        timestamp: issue?.updatedAt ? new Date(issue.updatedAt).toLocaleString() : '',
        details: stage.key === current ? 'Current stage' : '',
      })),
      currentIndex: currentIndex === -1 ? 0 : currentIndex,
    };
  }, [issue]);

  const handleUpvote = async () => {
    if (!issue || issue.issueTrack !== 'social') return;
    try {
      const response = await api.put(`/social-issues/${issue._id}/upvote`);
      setIssue(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to upvote this issue');
    }
  };

  const handleWitnessSubmit = async () => {
    if (!witness.trim() || !issue || issue.issueTrack !== 'social') return;
    try {
      const response = await api.post(`/social-issues/${issue._id}/witness`, { statement: witness.trim() });
      setIssue(response.data);
      setWitness('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add witness statement');
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/track/${id}`;
    const text = `Track this CivicVoice+ issue: ${url}`;
    if (navigator.share) {
      await navigator.share({ title: 'CivicVoice+ Issue Tracker', text, url });
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return <div className="tracker-page"><p>Loading issue tracker...</p></div>;
  }

  if (!issue) {
    return (
      <div className="tracker-page">
        <h1>Issue tracker</h1>
        <p>{error || 'Issue not found'}</p>
        <button type="button" onClick={() => navigate('/')}>Back to home</button>
      </div>
    );
  }

  const locationText = typeof issue.location === 'string'
    ? issue.location
    : [issue.location?.address, issue.location?.city, issue.location?.state].filter(Boolean).join(', ');

  return (
    <div className="tracker-page">
      <header className="tracker-header">
        <h1>Issue Tracker</h1>
        <div className="tracker-header-actions">
          <UrgencyBadge level={issue.urgencyLevel || issue.severity || 'low'} />
          <button type="button" onClick={handleShare}><Share2 size={15} /> Share</button>
        </div>
      </header>

      {(issue.urgencyLevel === 'emergency' || issue.severity === 'emergency') && (
        <EmergencyAlert
          message="Emergency response triggered for this issue."
          helplines={issue.helplineTriggered || []}
        />
      )}

      {issue.status === 'escalated' && (
        <EscalationBanner
          fromEntity={issue.assignedNGO?.name || 'NGO'}
          toEntity={issue.assignedDepartment?.name || 'Government Department'}
          reason={issue.escalationHistory?.slice(-1)?.[0]?.reason || 'Escalation initiated'}
          countdown="Escalated"
        />
      )}

      <section className="tracker-grid">
        <article className="tracker-card timeline-card">
          <h2>Timeline</h2>
          <ProgressTimeline stages={timelineStages.list} currentStage={timelineStages.currentIndex} />
        </article>

        <article className="tracker-card details-card">
          <h2>{issue.title || issue.issueType || 'Issue details'}</h2>
          <p>{issue.description}</p>
          <div className="detail-row"><strong>Category:</strong> {issue.socialCategory || issue.civicCategory || issue.issueType}</div>
          <div className="detail-row"><strong>Location:</strong> {locationText || 'Not provided'}</div>
          <div className="detail-row"><strong>Status:</strong> {issue.status}</div>
          <div className="detail-row"><strong>Tracking ID:</strong> {issue.publicId || issue._id}</div>
        </article>

        <article className="tracker-card handler-card">
          <h2>Assigned to</h2>
          <p>{issue.assignedNGO?.name || issue.assignedDepartment?.name || issue.forwardedTo?.name || 'Assignment pending'}</p>
          <small>{issue.assignedNGO?.contact?.email || issue.assignedDepartment?.contactEmail || 'Contact unavailable'}</small>
        </article>

        <article className="tracker-card community-card">
          <h2>Community Support</h2>
          <button type="button" onClick={handleUpvote} disabled={issue.issueTrack !== 'social'}>
            <ThumbsUp size={15} /> Upvote ({issue.communityUpvotes || 0})
          </button>

          <div className="witness-box">
            <textarea
              value={witness}
              onChange={(event) => setWitness(event.target.value)}
              placeholder="Add witness statement"
              rows={3}
            />
            <button type="button" onClick={handleWitnessSubmit} disabled={issue.issueTrack !== 'social'}>
              Add witness
            </button>
          </div>

          <ul>
            {(issue.witnesses || []).map((entry, index) => (
              <li key={`${entry.statement}-${index}`}>{entry.statement}</li>
            ))}
          </ul>
        </article>
      </section>

      {error ? <p className="tracker-error">{error}</p> : null}
    </div>
  );
};

export default IssueTrackerPage;
