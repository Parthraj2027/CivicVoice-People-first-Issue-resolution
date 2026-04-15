import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Clock3,
  Heart,
  MessageCircle,
  Send,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import api from '@/lib/apiClient';
import { fetchMyIssues } from '@/features/issues/issuesSlice';
import { fetchCommunityFeed, fetchPublicImpact } from '@/features/community/communitySlice';
import '@/styles/CitizenHomePage.css';

const civicIssueTypes = [
  { value: 'pothole', label: 'Pothole' },
  { value: 'streetlight', label: 'Streetlight' },
  { value: 'sewage', label: 'Sewage' },
  { value: 'garbage', label: 'Garbage' },
  { value: 'water', label: 'Water' },
  { value: 'other', label: 'Other' },
];

const socialCategories = [
  { value: 'womens_safety', label: 'Women Safety' },
  { value: 'child_labour', label: 'Child Labour' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'mental_health', label: 'Mental Health' },
  { value: 'hunger', label: 'Hunger' },
  { value: 'homelessness', label: 'Homelessness' },
  { value: 'education', label: 'Education' },
  { value: 'environment', label: 'Environment' },
  { value: 'elder_neglect', label: 'Elder Neglect' },
  { value: 'discrimination', label: 'Discrimination' },
  { value: 'substance_abuse', label: 'Substance Abuse' },
  { value: 'disability', label: 'Disability' },
];

const severityOptions = ['low', 'medium', 'high', 'critical'];
const urgencyOptions = ['low', 'medium', 'high', 'emergency'];

const formatCreatedAt = (value) => {
  if (!value) return 'Now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Now';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const CitizenHomePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { myIssues } = useSelector((state) => state.issues);
  const { feed, impact } = useSelector((state) => state.community);
  const navigate = useNavigate();

  const [civicForm, setCivicForm] = useState({
    issueType: 'pothole',
    location: '',
    description: '',
    severity: 'medium',
  });
  const [socialForm, setSocialForm] = useState({
    title: '',
    socialCategory: 'womens_safety',
    address: '',
    description: '',
    urgencyLevel: 'high',
  });
  const [feedDrafts, setFeedDrafts] = useState({});
  const [submittingCivic, setSubmittingCivic] = useState(false);
  const [submittingSocial, setSubmittingSocial] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true, state: { from: '/citizen' } });
      return;
    }

    if (user.role !== 'citizen') {
      navigate('/', { replace: true });
      return;
    }

    dispatch(fetchMyIssues());
    dispatch(fetchCommunityFeed({ limit: 18 }));
    dispatch(fetchPublicImpact());
  }, [dispatch, navigate, user]);

  const analytics = useMemo(() => {
    const total = myIssues.length;
    const resolved = myIssues.filter((item) => ['resolved', 'completed'].includes(item.status)).length;
    const active = total - resolved;
    const social = myIssues.filter((item) => item.issueTrack === 'social').length;
    const civic = myIssues.filter((item) => item.issueTrack !== 'social').length;
    const support = myIssues.reduce((sum, item) => sum + Number(item.communityUpvotes || 0), 0);

    return {
      total,
      resolved,
      active,
      social,
      civic,
      support,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    };
  }, [myIssues]);

  const recentMine = useMemo(() => myIssues.slice(0, 4), [myIssues]);
  const communityStream = useMemo(() => feed.slice(0, 8), [feed]);

  const refreshData = () => {
    dispatch(fetchMyIssues());
    dispatch(fetchCommunityFeed({ limit: 18 }));
    dispatch(fetchPublicImpact());
  };

  const handleCivicSubmit = async (event) => {
    event.preventDefault();
    if (!civicForm.location.trim() || !civicForm.description.trim()) {
      setErrorMessage('Please provide location and description for civic report.');
      return;
    }

    setSubmittingCivic(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await api.post('/issues', {
        issueType: civicForm.issueType,
        location: civicForm.location,
        severity: civicForm.severity,
        description: civicForm.description,
      });
      const created = response.data?.issue;
      setSuccessMessage(`Civic issue submitted: ${created?.publicId || 'tracking id generated'}`);
      setCivicForm({ issueType: 'pothole', location: '', description: '', severity: 'medium' });
      refreshData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to submit civic issue.');
    } finally {
      setSubmittingCivic(false);
    }
  };

  const handleSocialSubmit = async (event) => {
    event.preventDefault();
    if (!socialForm.address.trim() || !socialForm.description.trim()) {
      setErrorMessage('Please provide address and description for social report.');
      return;
    }

    setSubmittingSocial(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await api.post('/social-issues', {
        title: socialForm.title || 'Social issue report',
        socialCategory: socialForm.socialCategory,
        urgencyLevel: socialForm.urgencyLevel,
        severity: socialForm.urgencyLevel,
        description: socialForm.description,
        location: { address: socialForm.address },
      });
      const created = response.data?.issue;
      setSuccessMessage(`Social issue submitted: ${created?.publicId || 'tracking id generated'}`);
      setSocialForm({
        title: '',
        socialCategory: 'womens_safety',
        address: '',
        description: '',
        urgencyLevel: 'high',
      });
      refreshData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to submit social issue.');
    } finally {
      setSubmittingSocial(false);
    }
  };

  const handleFeedLike = async (issue) => {
    if (!issue?._id) return;
    if (issue.issueTrack !== 'social') {
      navigate(`/track/${issue._id}`);
      return;
    }

    try {
      await api.put(`/social-issues/${issue._id}/upvote`);
      refreshData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to register support.');
    }
  };

  const handleOpinionSubmit = async (issue) => {
    const statement = String(feedDrafts[issue._id] || '').trim();
    if (!statement) return;

    if (issue.issueTrack !== 'social') {
      setErrorMessage('Opinion comments are enabled for social issues in this version.');
      return;
    }

    try {
      await api.post(`/social-issues/${issue._id}/witness`, { statement });
      setFeedDrafts((prev) => ({ ...prev, [issue._id]: '' }));
      refreshData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to post your opinion.');
    }
  };

  if (!user || user.role !== 'citizen') return null;

  return (
    <div className="citizen-home citizen-home--dashboard">
      <div className="citizen-orb citizen-orb--one" aria-hidden="true"></div>
      <div className="citizen-orb citizen-orb--two" aria-hidden="true"></div>

      <section className="citizen-hero-panel">
        <div>
          <p className="citizen-hero-panel__eyebrow">Citizen command center</p>
          <h1>Welcome back, {user.name?.split(' ')[0] || 'Citizen'}</h1>
          <p>
            Manage civic and social reporting in one professional dashboard with real-time community interaction.
          </p>
          <div className="citizen-hero-badges">
            <span>Live support</span>
            <span>Role-safe workflow</span>
            <span>Public accountability</span>
          </div>
        </div>
        <div className="citizen-hero-actions">
          <button type="button" onClick={() => navigate('/community')}>Community feed</button>
          <button type="button" className="ghost" onClick={() => navigate('/impact')}>Impact dashboard</button>
        </div>
      </section>

      {errorMessage ? <p className="citizen-toast citizen-toast--error">{errorMessage}</p> : null}
      {successMessage ? <p className="citizen-toast citizen-toast--success">{successMessage}</p> : null}

      <div className="citizen-stage-grid">
        <aside className="citizen-analytics-rail">
          <article className="analytics-card big">
            <div className="analytics-card__head">
              <span>Performance</span>
              <TrendingUp size={18} />
            </div>
            <strong>{analytics.resolutionRate}%</strong>
            <p>Resolution pace on your submitted issues</p>
            <div className="progress-line">
              <span style={{ width: `${analytics.resolutionRate}%` }}></span>
            </div>
          </article>

          <article className="analytics-card">
            <div><BarChart3 size={16} /><span>Total reports</span></div>
            <strong>{analytics.total}</strong>
          </article>
          <article className="analytics-card">
            <div><BadgeCheck size={16} /><span>Resolved</span></div>
            <strong>{analytics.resolved}</strong>
          </article>
          <article className="analytics-card">
            <div><Clock3 size={16} /><span>Active</span></div>
            <strong>{analytics.active}</strong>
          </article>
          <article className="analytics-card">
            <div><Users size={16} /><span>Support received</span></div>
            <strong>{analytics.support}</strong>
          </article>

          <article className="analytics-card split">
            <div>
              <span>Civic</span>
              <strong>{analytics.civic}</strong>
            </div>
            <div>
              <span>Social</span>
              <strong>{analytics.social}</strong>
            </div>
          </article>

          <article className="analytics-card feed-list">
            <div className="analytics-card__head">
              <span>My recent issues</span>
              <Sparkles size={16} />
            </div>
            {recentMine.length === 0 ? <p>No submissions yet.</p> : null}
            {recentMine.map((item) => (
              <button key={item._id} type="button" onClick={() => navigate(`/track/${item._id}`)}>
                <span>{item.title || item.issueType}</span>
                <small>{item.status}</small>
              </button>
            ))}
          </article>
        </aside>

        <div className="citizen-main-board">
          <section className="citizen-kpi-ribbon">
            <article className="ribbon-card">
              <p>Platform social resolved</p>
              <strong>{impact?.socialResolved || 0}</strong>
            </article>
            <article className="ribbon-card">
              <p>Platform civic resolved</p>
              <strong>{impact?.civicResolved || 0}</strong>
            </article>
            <article className="ribbon-card">
              <p>Active NGOs</p>
              <strong>{impact?.ngosActive || 0}</strong>
            </article>
            <article className="ribbon-card">
              <p>Volunteers</p>
              <strong>{impact?.volunteersActive || 0}</strong>
            </article>
          </section>

          <section className="citizen-lower-deck" aria-label="Citizen working sections">
            <article className="deck-panel report-panel civic">
              <div className="deck-panel__head">
                <h2>Civic issue report</h2>
                <ShieldAlert size={16} />
              </div>
              <form onSubmit={handleCivicSubmit}>
                <label>
                  Issue type
                  <select value={civicForm.issueType} onChange={(e) => setCivicForm((prev) => ({ ...prev, issueType: e.target.value }))}>
                    {civicIssueTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Location
                  <input
                    type="text"
                    value={civicForm.location}
                    onChange={(e) => setCivicForm((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="Area / street / locality"
                  />
                </label>
                <label>
                  Severity
                  <select value={civicForm.severity} onChange={(e) => setCivicForm((prev) => ({ ...prev, severity: e.target.value }))}>
                    {severityOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Description
                  <textarea
                    rows={4}
                    value={civicForm.description}
                    onChange={(e) => setCivicForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the civic issue"
                  />
                </label>
                <button type="submit" disabled={submittingCivic}>
                  {submittingCivic ? 'Submitting...' : 'Submit civic issue'} <ArrowRight size={14} />
                </button>
              </form>
            </article>

            <article className="deck-panel feed-panel">
              <div className="deck-panel__head">
                <h2>Community issue stream</h2>
                <span>Like, comment, opinion</span>
              </div>
              <div className="feed-scroll-area">
                {communityStream.length === 0 ? <p className="empty-feed">Community feed is loading...</p> : null}
                {communityStream.map((issue) => (
                  <div key={issue._id} className="feed-card">
                    <header>
                      <span className={`track-pill ${issue.issueTrack === 'social' ? 'social' : 'civic'}`}>
                        {issue.issueTrack || 'issue'}
                      </span>
                      <small>{issue.status || 'pending'}</small>
                    </header>
                    <h3>{issue.title || issue.issueType || 'Community issue'}</h3>
                    <p>{issue.summary || issue.description || 'No additional details available.'}</p>
                    <div className="feed-meta-row">
                      <span>{formatCreatedAt(issue.createdAt)}</span>
                      <span>{issue.witnesses?.length || 0} opinions</span>
                      <span>{issue.location?.city || issue.location?.address || 'Location hidden'}</span>
                    </div>
                    <footer>
                      <button type="button" onClick={() => handleFeedLike(issue)}>
                        <Heart size={14} /> {issue.communityUpvotes || 0}
                      </button>
                      <button type="button" onClick={() => navigate(`/track/${issue._id}`)}>
                        <MessageCircle size={14} /> Open
                      </button>
                    </footer>
                    <div className="feed-opinion-box">
                      <input
                        type="text"
                        value={feedDrafts[issue._id] || ''}
                        onChange={(e) => setFeedDrafts((prev) => ({ ...prev, [issue._id]: e.target.value }))}
                        placeholder="Share your opinion"
                      />
                      <button type="button" onClick={() => handleOpinionSubmit(issue)}>
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="deck-panel report-panel social">
              <div className="deck-panel__head">
                <h2>Social issue report</h2>
                <Users size={16} />
              </div>
              <form onSubmit={handleSocialSubmit}>
                <label>
                  Title
                  <input
                    type="text"
                    value={socialForm.title}
                    onChange={(e) => setSocialForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Short issue title"
                  />
                </label>
                <label>
                  Category
                  <select value={socialForm.socialCategory} onChange={(e) => setSocialForm((prev) => ({ ...prev, socialCategory: e.target.value }))}>
                    {socialCategories.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Urgency
                  <select value={socialForm.urgencyLevel} onChange={(e) => setSocialForm((prev) => ({ ...prev, urgencyLevel: e.target.value }))}>
                    {urgencyOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Address
                  <input
                    type="text"
                    value={socialForm.address}
                    onChange={(e) => setSocialForm((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Where this support is needed"
                  />
                </label>
                <label>
                  Description
                  <textarea
                    rows={4}
                    value={socialForm.description}
                    onChange={(e) => setSocialForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe social concern with details"
                  />
                </label>
                <button type="submit" disabled={submittingSocial}>
                  {submittingSocial ? 'Submitting...' : 'Submit social issue'} <ArrowRight size={14} />
                </button>
              </form>
            </article>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CitizenHomePage;
