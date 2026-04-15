import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCommunityFeed } from '@/features/community/communitySlice';
import IssueCard from '@/components/library/IssueCard';
import '@/styles/CommunityPage.css';

const filters = ['all', 'civic', 'social', 'urgent', 'recent'];

const CommunityPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { feed } = useSelector((state) => state.community);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const params = {};
    if (activeFilter === 'civic' || activeFilter === 'social') params.track = activeFilter;
    if (activeFilter === 'urgent') params.status = 'escalated';
    dispatch(fetchCommunityFeed(params));
  }, [activeFilter, dispatch]);

  return (
    <div className="community-page">
      <h1>Community Feed</h1>
      <p>Nearby open issues and support activity.</p>
      <div className="community-filters">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={activeFilter === filter ? 'active' : ''}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>
      <section className="community-list">
        {feed.map((issue) => (
          <IssueCard
            key={issue._id}
            issue={issue}
            onOpen={() => navigate(`/track/${issue._id}`)}
            onUpvote={() => navigate(`/track/${issue._id}`)}
            variant={issue.issueTrack === 'social' ? 'social' : 'civic'}
          />
        ))}
      </section>
    </div>
  );
};

export default CommunityPage;
