import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDepartmentIssues,
  departmentUpdateIssue,
} from '@/features/issues/issuesSlice';
import { Building2, Clock, MapPin, AlertTriangle, Save, MessageSquare, FileText, Filter, X, Maximize2, Star } from 'lucide-react';
import LocationPicker from '@/components/LocationPicker';
import '@/styles/DepartmentHomePage.css';

const DepartmentHomePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { departmentIssues } = useSelector((state) => state.issues);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [statusDrafts, setStatusDrafts] = useState({});
  const [resolutionFiles, setResolutionFiles] = useState({});
  const [expandedMap, setExpandedMap] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    severity: '',
    status: '',
    recurrence: '',
    dateFrom: '',
    dateTo: '',
  });

  const unifiedStatuses = [
    'pending',
    'in_review',
    'submitted',
    'reviewing',
    'assigned',
    'in_progress',
    'escalated',
    'reopened',
    'resolved',
    'completed',
    'closed',
  ];

  const getIssueCoordinates = (issue) => {
    if (!issue) return null;
    if (typeof issue?.geoLocation?.latitude === 'number' && typeof issue?.geoLocation?.longitude === 'number') {
      return issue.geoLocation;
    }

    const lat = Number(issue?.location?.lat ?? issue?.location?.latitude);
    const lng = Number(issue?.location?.lng ?? issue?.location?.longitude);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { latitude: lat, longitude: lng };
    }

    return null;
  };

  const getIssueLocationText = (issue) => {
    const location = issue?.location;
    if (!location) return 'Location unavailable';
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      return [location.address, location.city, location.state, location.pincode].filter(Boolean).join(', ') || 'Location unavailable';
    }
    return 'Location unavailable';
  };

  useEffect(() => {
    dispatch(fetchDepartmentIssues());
  }, [dispatch]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      severity: '',
      status: '',
      recurrence: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const filteredIssues = useMemo(() => {
    let filtered = [...departmentIssues];

    if (filters.severity) {
      filtered = filtered.filter((i) => i.severity === filters.severity);
    }

    if (filters.status) {
      filtered = filtered.filter((i) => i.status === filters.status);
    }

    if (filters.recurrence) {
      filtered = filtered.filter((i) => i.recurrence === filters.recurrence);
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter((i) => new Date(i.createdAt) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((i) => new Date(i.createdAt) <= toDate);
    }

    return filtered;
  }, [departmentIssues, filters]);

  const statusCounts = useMemo(() => {
    const counts = { open: 0, in_progress: 0, resolved: 0 };
    filteredIssues.forEach((i) => {
      if (['completed', 'resolved', 'closed'].includes(i.status)) counts.resolved += 1;
      else if (['in_review', 'reviewing', 'assigned', 'in_progress', 'escalated'].includes(i.status)) counts.in_progress += 1;
      else counts.open += 1;
    });
    return counts;
  }, [filteredIssues]);

  const handleCommentChange = (id, value) => {
    setCommentDrafts((prev) => ({ ...prev, [id]: value }));
  };

  const handleStatusChange = (id, value) => {
    setStatusDrafts((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (issueId, e) => {
    const files = Array.from(e.target.files);
    const errors = [];
    const validFiles = [];

    // Check maximum 3 files
    const currentFiles = resolutionFiles[issueId] || [];
    if (currentFiles.length + files.length > 3) {
      alert('You can only attach up to 3 files');
      return;
    }

    files.forEach(file => {
      // Check file size (50MB)
      if (file.size > 50 * 1024 * 1024) {
        errors.push(`${file.name} exceeds 50MB limit`);
        return;
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'video/mp4'];
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name} is not a valid file type (allowed: jpg, png, pdf, mp4)`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setResolutionFiles((prev) => ({ 
        ...prev, 
        [issueId]: [...(prev[issueId] || []), ...validFiles] 
      }));
    }
  };

  const removeResolutionFile = (issueId, fileIndex) => {
    setResolutionFiles((prev) => ({
      ...prev,
      [issueId]: prev[issueId].filter((_, i) => i !== fileIndex)
    }));
  };

  const handleSubmitUpdate = async (issueId) => {
    const comment = commentDrafts[issueId];
    const status = statusDrafts[issueId];
    const files = resolutionFiles[issueId];
    
    // Find the current issue to check if status actually changed
    const currentIssue = departmentIssues.find(i => i._id === issueId);
    const statusChanged = status && currentIssue && status !== currentIssue.status;

    if (!comment && !statusChanged) {
      alert('Please enter a comment or change the status to submit an update.');
      return;
    }

    try {
      // If there are files and status is being changed to a resolved state, upload them first
      let resolutionEvidence = [];
      if (files && files.length > 0 && (status === 'completed' || status === 'resolved')) {
        console.log('Uploading files:', files);
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('files', file);
        });

        const uploadRes = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/uploads/multiple`,
          {
            method: 'POST',
            credentials: 'include', // Important: Send cookies with request
            body: formData,
            // Don't set Content-Type header - browser will set it automatically with boundary
          }
        );

        console.log('Upload response status:', uploadRes.status);

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}));
          console.error('Upload error:', errorData);
          throw new Error(errorData.message || 'Failed to upload resolution evidence');
        }

        const uploadData = await uploadRes.json();
        console.log('Upload data:', uploadData);
        resolutionEvidence = uploadData.files ? uploadData.files.map(f => f.url) : [];
      }

      console.log('Submitting update with evidence:', resolutionEvidence);
      
      await dispatch(
        departmentUpdateIssue({
          id: issueId,
          data: { 
            comment: comment || undefined, 
            status: statusChanged ? status : undefined,
            resolutionEvidence: resolutionEvidence.length > 0 ? resolutionEvidence : undefined
          },
        })
      ).unwrap();

      setCommentDrafts((prev) => ({ ...prev, [issueId]: '' }));
      setStatusDrafts((prev) => ({ ...prev, [issueId]: '' }));
      setResolutionFiles((prev) => ({ ...prev, [issueId]: [] }));
      
      alert('Update submitted successfully!');
    } catch (err) {
      console.error('Update error:', err);
      alert(err.message || err.toString() || 'Failed to submit update. Please try again.');
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="department-home">
      <div className="department-card glass slide-up">
        <div className="department-header">
          <div className="department-header-content">
            <div className="department-icon">
              <Building2 size={24} />
            </div>
            <div>
              <h2>{user?.department?.name || 'Department Dashboard'}</h2>
              <p>
                Work through forwarded complaints, update statuses, and leave clear notes
                for admins and citizens.
              </p>
            </div>
          </div>
        </div>

        <div className="status-summary dept-summary slide-in-left stagger-1">
          <div className="status-pill pending">
            <AlertTriangle size={16} />
            Open <span>{statusCounts.open}</span>
          </div>
          <div className="status-pill in_review">
            <Clock size={16} />
            In Progress <span>{statusCounts.in_progress}</span>
          </div>
          <div className="status-pill completed">
            <Save size={16} />
            Resolved <span>{statusCounts.resolved}</span>
          </div>
        </div>

        <div className="filter-section slide-in-right stagger-2">
          <button 
            className="filter-toggle-btn secondary-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {Object.values(filters).some(v => v) && (
              <span className="filter-count">{Object.values(filters).filter(v => v).length}</span>
            )}
          </button>

          {showFilters && (
            <div className="filter-panel">
              <div className="filter-grid">
                <div className="filter-group">
                  <label>Severity</label>
                  <select 
                    value={filters.severity} 
                    onChange={(e) => handleFilterChange('severity', e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Status</label>
                  <select 
                    value={filters.status} 
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">All</option>
                    {unifiedStatuses.map((statusOption) => (
                      <option key={statusOption} value={statusOption}>
                        {statusOption.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Recurrence</label>
                  <select 
                    value={filters.recurrence} 
                    onChange={(e) => handleFilterChange('recurrence', e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="new">New</option>
                    <option value="recurring">Recurring</option>
                    <option value="ongoing">Ongoing</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Date From</label>
                  <input 
                    type="date" 
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label>Date To</label>
                  <input 
                    type="date" 
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-actions">
                <button className="ghost-btn" onClick={clearFilters}>
                  <X size={16} />
                  Clear All
                </button>
                <span className="filter-result-count">
                  Showing {filteredIssues.length} of {departmentIssues.length} complaints
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="dept-issue-list">
          {departmentIssues.length === 0 && (
            <p className="no-issues">
              <AlertTriangle size={20} />
              No complaints have been forwarded to this department yet.
            </p>
          )}
          {filteredIssues.map((issue, idx) => (
            <div key={issue._id} className={`dept-issue-card hover-float fade-scale stagger-${Math.min(idx + 1, 5)}`}>
              <div className="dept-issue-header">
                <div>
                  <h3>{issue.issueType}</h3>
                  <p className="dept-issue-meta">
                    <MapPin size={14} />
                    {getIssueLocationText(issue)}
                    <span>•</span>
                    <AlertTriangle size={14} />
                    Severity: <span className={`severity-badge severity-${issue.severity}`}>{issue.severity}</span>
                    <span>•</span>
                    <strong>{(issue.issueTrack || 'civic').toUpperCase()}</strong>
                  </p>
                  <p className="dept-issue-meta">
                    <code>CV-{issue._id.slice(-6).toUpperCase()}</code>
                  </p>
                </div>
                <span className={`status-badge status-${issue.status}`}>
                  {issue.status.replace('_', ' ')}
                </span>
              </div>
              <p className="dept-issue-summary">{issue.summary}</p>
              {getIssueCoordinates(issue) && (
                <div className="dept-issue-map">
                  <div className="map-header">
                    <span className="map-label">Pinned location</span>
                    <button 
                      className="map-expand-btn"
                      onClick={() => setExpandedMap(getIssueCoordinates(issue))}
                      title="Expand map"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                  <LocationPicker
                    value={getIssueCoordinates(issue)}
                    readOnly
                    showLocateButton={false}
                    label=""
                    helperText=""
                    height={300}
                  />
                </div>
              )}

              {issue.evidenceUrls && issue.evidenceUrls.length > 0 && (
                <div className="issue-evidence">
                  <h4>
                    <FileText size={14} />
                    Evidence ({issue.evidenceUrls.length})
                  </h4>
                  <div className="evidence-links">
                    {issue.evidenceUrls.map((url, idx) => (
                      <a
                        key={idx}
                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="evidence-link"
                      >
                        <FileText size={14} />
                        Evidence {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {issue.departmentUpdates && issue.departmentUpdates.length > 0 && (
                <div className="issue-timeline">
                  <h4>
                    <MessageSquare size={14} />
                    Update Timeline
                  </h4>
                  <ul>
                    {issue.departmentUpdates.map((u, idx) => (
                      <li key={idx}>
                        <span className="timeline-time">
                          {formatDateTime(u.createdAt)}
                        </span>
                        <span className="timeline-text">
                          <span className={`status-badge status-${u.status}`}>
                            {u.status.replace('_', ' ')}
                          </span>
                          {u.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {issue.rating && (
                <div className="existing-rating">
                  <h4>
                    <Star size={14} />
                    Citizen Rating & Review
                  </h4>
                  <div className="stars-display">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        fill={star <= issue.rating ? '#fbbf24' : 'none'}
                        color={star <= issue.rating ? '#fbbf24' : '#d1d5db'}
                      />
                    ))}
                    <span className="rating-value">({issue.rating}/5)</span>
                  </div>
                  {issue.review && (
                    <div className="review-text">
                      <p>"{issue.review}"</p>
                      {issue.reviewedAt && (
                        <span className="review-date">
                          Submitted on {formatDateTime(issue.reviewedAt)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="dept-issue-actions">
                <select
                  value={statusDrafts[issue._id] || issue.status}
                  onChange={(e) => handleStatusChange(issue._id, e.target.value)}
                >
                  {unifiedStatuses.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {(statusDrafts[issue._id] === 'completed' || statusDrafts[issue._id] === 'resolved' || issue.status === 'completed' || issue.status === 'resolved') && (
                <div className="resolution-evidence-upload">
                  <label>
                    <FileText size={16} />
                    Upload Resolution Evidence (Photos/Documents):
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,application/pdf,video/mp4"
                    onChange={(e) => handleFileChange(issue._id, e)}
                  />
                  <p className="file-help-text">
                    Max 3 files • 50MB each • Formats: JPG, PNG, PDF, MP4
                  </p>
                  {resolutionFiles[issue._id] && resolutionFiles[issue._id].length > 0 && (
                    <div className="selected-files-list">
                      {resolutionFiles[issue._id].map((file, idx) => (
                        <div key={idx} className="selected-file-item">
                          <div className="file-info">
                            <FileText size={14} />
                            <span className="file-name">{file.name}</span>
                            <span className="file-size">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            className="remove-file-btn"
                            onClick={() => removeResolutionFile(issue._id, idx)}
                            title="Remove file"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {issue.resolutionEvidence && issue.resolutionEvidence.length > 0 && (
                <div className="issue-evidence resolution-evidence">
                  <h4>
                    <FileText size={14} />
                    Resolution Evidence ({issue.resolutionEvidence.length})
                  </h4>
                  <div className="evidence-links">
                    {issue.resolutionEvidence.map((url, idx) => (
                      <a
                        key={idx}
                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="evidence-link"
                      >
                        <FileText size={14} />
                        Resolution {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="dept-comment-box">
                <textarea
                  rows={3}
                  placeholder="Add a brief note about what your team is doing..."
                  value={commentDrafts[issue._id] || ''}
                  onChange={(e) => handleCommentChange(issue._id, e.target.value)}
                />
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => handleSubmitUpdate(issue._id)}
                >
                  <Save size={16} />
                  Save Update
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {expandedMap && (
        <div className="map-modal" onClick={() => setExpandedMap(null)}>
          <div className="map-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="map-modal-header">
              <h3>Location Details</h3>
              <button className="map-modal-close" onClick={() => setExpandedMap(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="map-modal-body">
              <LocationPicker
                value={expandedMap}
                readOnly
                showLocateButton={false}
                label=""
                helperText=""
                height={500}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentHomePage;
