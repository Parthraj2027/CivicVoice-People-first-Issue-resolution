import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchMyIssues } from '@/features/issues/issuesSlice';
import { fetchCommunityFeed } from '@/features/community/communitySlice';
import IssueCard from '@/components/library/IssueCard';
import KarmaScore from '@/components/library/KarmaScore';
import '@/styles/CitizenDashboardPage.css';

const tabs = ['My Issues', 'Community Feed', 'Notifications'];

const CitizenDashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { myIssues } = useSelector((state) => state.issues);
  const { feed } = useSelector((state) => state.community);
  const [activeTab, setActiveTab] = useState('My Issues');

  useEffect(() => {
    dispatch(fetchMyIssues());
    dispatch(fetchCommunityFeed({ limit: 15 }));
  }, [dispatch]);

  useEffect(() => {
    if (!user || user.role !== 'citizen') {
      navigate('/login/citizen');
    }
  }, [navigate, user]);

  const metrics = useMemo(() => {
    const resolved = myIssues.filter((item) => ['resolved', 'completed'].includes(item.status)).length;
    const pending = myIssues.filter((item) => !['resolved', 'completed'].includes(item.status)).length;
    return [
      { label: 'My Reports', value: myIssues.length },
      { label: 'Resolved', value: resolved },
      { label: 'Pending', value: pending },
      { label: 'Karma Score', value: user?.karma || 0 },
    ];
  }, [myIssues, user?.karma]);

  return (
    <div className="citizen-dashboard-page">
      <header className="citizen-dashboard-header">
        <h1>Citizen Dashboard</h1>
        <p>Track your reports, support nearby issues, and build civic karma.</p>
      </header>

      <section className="metric-row">
        {metrics.map((metric) => (
          <article key={metric.label} className="metric-card">
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </article>
        ))}
      </section>

      <section className="dashboard-tabs" role="tablist" aria-label="Citizen dashboard tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </section>

      {activeTab === 'My Issues' ? (
        <section className="tab-panel">
          <div className="issue-grid">
            {myIssues.map((issue) => (
              <IssueCard
                key={issue._id}
                issue={issue}
                onOpen={() => navigate(`/track/${issue._id}`)}
                onUpvote={() => {}}
              />
            ))}
            {myIssues.length === 0 ? <p>No issues yet. Start with your first report.</p> : null}
          </div>
        </section>
      ) : null}

      {activeTab === 'Community Feed' ? (
        <section className="tab-panel">
          <div className="issue-grid">
            {feed.map((issue) => (
              <IssueCard
                key={issue._id}
                issue={issue}
                onOpen={() => navigate(`/track/${issue._id}`)}
                onUpvote={() => navigate(`/track/${issue._id}`)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'Notifications' ? (
        <section className="tab-panel notifications-panel">
          <p>Status updates, NGO responses, and community upvotes will appear here.</p>
          <ul>
            <li>Your report is assigned to a handler.</li>
            <li>Your report has received new community support.</li>
            <li>Your issue moved to in-progress stage.</li>
          </ul>
        </section>
      ) : null}

      <section className="achievements-row">
        <KarmaScore score={user?.karma || 0} badges={user?.badges || []} />
      </section>
    </div>
  );
};

export default CitizenDashboardPage;
