import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock3, ExternalLink, HeartHandshake, LifeBuoy, SendToBack } from 'lucide-react';
import {
  acceptNgoCase,
  escalateNgoCase,
  fetchManagedNgo,
  fetchNgoAnalytics,
  fetchNgoIssues,
  resolveNgoCase,
} from '@/features/ngo/ngoSlice';
import UrgencyBadge from '@/components/library/UrgencyBadge';
import '@/styles/NGOPortalPage.css';

const caseStatuses = ['all', 'pending', 'assigned', 'in_progress', 'resolved', 'escalated'];

const NGOPortalPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { selected, issues, analytics, error, status } = useSelector((state) => state.ngo);

  const [activeStatus, setActiveStatus] = useState('all');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'ngo') {
      navigate('/login/ngo');
      return;
    }

    dispatch(fetchManagedNgo());
  }, [dispatch, navigate, user]);

  useEffect(() => {
    if (!selected?._id) return;
    dispatch(fetchNgoIssues(selected._id));
    dispatch(fetchNgoAnalytics(selected._id));
  }, [dispatch, selected?._id]);

  const filteredCases = useMemo(() => {
    if (activeStatus === 'all') return issues;
    return issues.filter((item) => item.status === activeStatus);
  }, [activeStatus, issues]);

  const overview = useMemo(() => {
    return {
      assigned: analytics?.assigned || issues.length,
      resolved: analytics?.resolved || issues.filter((item) => item.status === 'resolved').length,
      escalated: analytics?.escalated || issues.filter((item) => item.status === 'escalated').length,
      responseTimeAvg: analytics?.responseTimeAvg || selected?.responseTimeAvg || 0,
    };
  }, [analytics, issues, selected?.responseTimeAvg]);

  const handleAccept = async (issueId) => {
    if (!selected?._id) return;
    await dispatch(acceptNgoCase({ ngoId: selected._id, issueId })).unwrap().catch(() => null);
    setActionMessage('Case accepted');
  };

  const handleResolve = async (issueId) => {
    if (!selected?._id) return;
    const reason = window.prompt('Add a short resolution note:');
    await dispatch(resolveNgoCase({ ngoId: selected._id, issueId, payload: { reason: reason || 'Resolved by NGO' } }))
      .unwrap()
      .catch(() => null);
    setActionMessage('Case resolved');
  };

  const handleEscalate = async (issueId) => {
    if (!selected?._id) return;
    const reason = window.prompt('Reason for escalation to government:');
    if (!reason) return;
    await dispatch(escalateNgoCase({ ngoId: selected._id, issueId, reason })).unwrap().catch(() => null);
    setActionMessage('Case escalated to government');
  };

  return (
    <div className="ngo-portal-page">
      <header className="ngo-hero">
        <div>
          <h1><HeartHandshake size={22} /> NGO Portal</h1>
          <p>{selected?.name || 'Loading NGO profile...'}</p>
        </div>
        <button type="button" className="ghost-cta" onClick={() => navigate('/community')}>
          Open community feed <ExternalLink size={14} />
        </button>
      </header>

      {error ? <p className="ngo-error">{error}</p> : null}
      {actionMessage ? <p className="ngo-success">{actionMessage}</p> : null}

      <section className="ngo-overview-grid">
        <article>
          <Clock3 size={18} />
          <strong>{overview.assigned}</strong>
          <span>Assigned Cases</span>
        </article>
        <article>
          <CheckCircle2 size={18} />
          <strong>{overview.resolved}</strong>
          <span>Resolved</span>
        </article>
        <article>
          <SendToBack size={18} />
          <strong>{overview.escalated}</strong>
          <span>Escalated</span>
        </article>
        <article>
          <LifeBuoy size={18} />
          <strong>{overview.responseTimeAvg}h</strong>
          <span>Avg Response</span>
        </article>
      </section>

      <section className="ngo-cases-card">
        <div className="ngo-cases-header">
          <h2>Case Queue</h2>
          <div className="ngo-filters">
            {caseStatuses.map((statusName) => (
              <button
                key={statusName}
                type="button"
                className={activeStatus === statusName ? 'active' : ''}
                onClick={() => setActiveStatus(statusName)}
              >
                {statusName}
              </button>
            ))}
          </div>
        </div>

        {status === 'loading' ? <p>Loading cases...</p> : null}

        <div className="ngo-cases-list">
          {filteredCases.map((issue) => (
            <article key={issue._id} className="ngo-case-item">
              <div className="ngo-case-head">
                <div>
                  <h3>{issue.title || issue.socialCategory || issue.publicId}</h3>
                  <p>{issue.description}</p>
                </div>
                <UrgencyBadge level={issue.urgencyLevel || issue.severity || 'medium'} />
              </div>

              <div className="ngo-case-meta">
                <span>Status: {issue.status}</span>
                <span>Category: {issue.socialCategory || 'social'}</span>
                <span>Upvotes: {issue.communityUpvotes || 0}</span>
                <span>Tracking: {issue.publicId || issue._id}</span>
              </div>

              {issue.status === 'escalated' ? (
                <p className="escalated-note"><AlertTriangle size={14} /> This case is escalated to government.</p>
              ) : null}

              <div className="ngo-case-actions">
                <button type="button" onClick={() => navigate(`/track/${issue._id}`)}>Open Tracker</button>
                {issue.status === 'pending' ? (
                  <button type="button" onClick={() => handleAccept(issue._id)}>Accept</button>
                ) : null}
                {['assigned', 'in_progress'].includes(issue.status) ? (
                  <button type="button" onClick={() => handleResolve(issue._id)}>Resolve</button>
                ) : null}
                {['assigned', 'in_progress', 'pending'].includes(issue.status) ? (
                  <button type="button" className="danger" onClick={() => handleEscalate(issue._id)}>Escalate</button>
                ) : null}
              </div>
            </article>
          ))}
          {filteredCases.length === 0 ? <p className="empty-note">No cases found for this filter.</p> : null}
        </div>
      </section>
    </div>
  );
};

export default NGOPortalPage;
