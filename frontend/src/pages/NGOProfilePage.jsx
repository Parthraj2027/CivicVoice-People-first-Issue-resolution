import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchNgoById } from '@/features/ngo/ngoSlice';
import '@/styles/NGODirectoryPage.css';

const formatSpecialization = (value) =>
  value
    ?.split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'General Support';

const NGOProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selected } = useSelector((state) => state.ngo);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchNgoById(id));
  }, [dispatch, id]);

  if (!selected || selected._id !== id) {
    return <div className="ngo-directory-page"><p>Loading NGO profile...</p></div>;
  }

  const reportPath = `/report?type=social&ngo=${selected._id}`;

  return (
    <div className="ngo-directory-page ngo-profile-page">
      <h1>{selected.name}</h1>
      <p>{selected.description}</p>
      <div className="ngo-profile-meta">
        <span>{selected.isVerified ? 'Verified' : 'Not verified'}</span>
        <span>Cases handled: {selected.casesHandled}</span>
        <span>Resolution rate: {selected.resolutionRate}%</span>
      </div>

      <div className="ngo-profile-layout">
        <div>
          <strong>Specializations</strong>
          <div className="ngo-specialization-list">
            {(selected.specializations || []).length > 0
              ? selected.specializations.map((specialization) => (
                <span key={specialization}>{formatSpecialization(specialization)}</span>
              ))
              : <span>General Social Support</span>}
          </div>
        </div>

        <div>
          <strong>Service areas</strong>
          <div className="ngo-service-area-list">
            {(selected.serviceAreas || []).length > 0
              ? selected.serviceAreas.map((area) => (
                <span key={`${area.city || ''}-${area.state || ''}`}>{[area.city, area.state].filter(Boolean).join(', ') || 'Remote support'}</span>
              ))
              : <span>Location not specified</span>}
          </div>
        </div>

        <div className="ngo-contact-grid">
          <strong>Contact</strong>
          {selected.contactInfo?.phone ? <a href={`tel:${selected.contactInfo.phone}`}>{selected.contactInfo.phone}</a> : null}
          {selected.contactInfo?.email ? <a href={`mailto:${selected.contactInfo.email}`}>{selected.contactInfo.email}</a> : null}
          {selected.contactInfo?.website ? <a href={selected.contactInfo.website} target="_blank" rel="noreferrer">Visit website</a> : null}
        </div>

        <div className="ngo-profile-actions">
          <button
            type="button"
            onClick={() => {
              if (user) {
                navigate(reportPath);
              } else {
                navigate('/login', { state: { from: reportPath } });
              }
            }}
          >
            Get help from this NGO
          </button>
          <button type="button" className="ghost" onClick={() => navigate('/ngos')}>
            Back to directory
          </button>
        </div>
      </div>
    </div>
  );
};

export default NGOProfilePage;
