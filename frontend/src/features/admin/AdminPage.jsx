import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchIssues,
  fetchDepartments,
  updateIssue,
  deleteIssue,
  fetchDepartmentUsers,
  createDepartmentUser,
  updateDepartmentUser,
  deleteDepartmentUser,
  reopenIssue,
} from '@/features/issues/issuesSlice';
import {
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle,
  MapPin,
  Building2,
  Send,
  UserPlus,
  Trash2,
  MessageSquare,
  FileText,
  RotateCcw,
  Image as ImageIcon,
  Filter,
  X,
  Maximize2,
  User,
  Phone,
  Mail,
  Star,
  Bell,
  Plus,
  Edit2,
  Save,
  Paperclip,
  Film,
  FileUp,
} from 'lucide-react';
import api from '@/lib/apiClient';
import '@/styles/AdminPage.css';
import LocationPicker from '@/components/LocationPicker';

const AdminPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items, departments, status, error, departmentUsers } = useSelector(
    (state) => state.issues
  );

  const [newDeptUser, setNewDeptUser] = useState({
    name: '',
    email: '',
    password: '',
    departmentName: '',
  });
  const [deptUserMessage, setDeptUserMessage] = useState(null);
  const [deptUserError, setDeptUserError] = useState(null);
  const [reopenComments, setReopenComments] = useState({});
  const [showReopenForm, setShowReopenForm] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedMap, setExpandedMap] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    severity: '',
    department: '',
    status: '',
    recurrence: '',
    dateFrom: '',
    dateTo: '',
  });
  const [activeTab, setActiveTab] = useState('complaints');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [generalInput, setGeneralInput] = useState('');
  const [generalInputMessage, setGeneralInputMessage] = useState(null);
  const [generalInputError, setGeneralInputError] = useState(null);
  const [structuredData, setStructuredData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [alertForm, setAlertForm] = useState({
    title: '',
    message: '',
    type: 'info',
    endDate: '',
  });
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertError, setAlertError] = useState(null);
  const [pendingEvidenceFiles, setPendingEvidenceFiles] = useState([]);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceUploadErrors, setEvidenceUploadErrors] = useState([]);

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
    dispatch(fetchIssues());
    dispatch(fetchDepartments());
    dispatch(fetchDepartmentUsers());
    if (activeTab === 'alerts') {
      fetchAlerts();
    }
  }, [dispatch, activeTab]);

  const fetchAlerts = async () => {
    setAlertsLoading(true);
    try {
      const response = await api.get('/alerts');
      setAlerts(response.data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setAlertsLoading(false);
    }
  };

  const handleAlertFormChange = (field, value) => {
    setAlertForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    setAlertMessage(null);
    setAlertError(null);

    if (!alertForm.title || !alertForm.message) {
      setAlertError('Title and message are required');
      return;
    }

    try {
      if (editingAlert) {
        await api.patch(`/alerts/${editingAlert._id}`, alertForm);
        setAlertMessage('Alert updated successfully');
      } else {
        await api.post('/alerts', alertForm);
        setAlertMessage('Alert created successfully');
      }
      setAlertForm({ title: '', message: '', type: 'info', endDate: '' });
      setShowAlertForm(false);
      setEditingAlert(null);
      fetchAlerts();
    } catch (err) {
      setAlertError(err.message || 'Failed to save alert');
    }
  };

  const handleEditAlert = (alert) => {
    setEditingAlert(alert);
    setAlertForm({
      title: alert.title,
      message: alert.message,
      type: alert.type,
      endDate: alert.endDate ? new Date(alert.endDate).toISOString().split('T')[0] : '',
    });
    setShowAlertForm(true);
  };

  const handleToggleAlertStatus = async (alertId, currentStatus) => {
    try {
      await api.patch(`/alerts/${alertId}`, { isActive: !currentStatus });
      fetchAlerts();
    } catch (err) {
      setAlertError(err.message || 'Failed to update alert status');
    }
  };

  const handleDeleteAlert = async (alertId) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        await api.delete(`/alerts/${alertId}`);
        setAlertMessage('Alert deleted successfully');
        fetchAlerts();
      } catch (err) {
        setAlertError(err.message || 'Failed to delete alert');
      }
    }
  };

  const handleForward = (issueId, deptId) => {
    if (!deptId) return;
    dispatch(updateIssue({ id: issueId, data: { forwardedTo: deptId } }));
  };

  const handleStatusChange = (issueId, statusValue) => {
    dispatch(updateIssue({ id: issueId, data: { status: statusValue } }));
  };

  const onChangeNewDeptUser = (e) => {
    setNewDeptUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateDeptUser = async (e) => {
    e.preventDefault();
    setDeptUserMessage(null);
    setDeptUserError(null);
    if (
      !newDeptUser.name ||
      !newDeptUser.email ||
      !newDeptUser.password ||
      !newDeptUser.departmentName
    ) {
      setDeptUserError('Fill all fields to create a department account.');
      return;
    }
    try {
      await dispatch(createDepartmentUser(newDeptUser)).unwrap();
      setDeptUserMessage('Department account created successfully.');
      setNewDeptUser({
        name: '',
        email: '',
        password: '',
        departmentName: '',
      });
      // Refresh departments list to include any newly created department
      dispatch(fetchDepartments());
    } catch (err) {
      setDeptUserError(err || 'Failed to create account.');
    }
  };

  const handleChangeDeptForUser = (userId, departmentId) => {
    if (!departmentId) return;
    dispatch(updateDepartmentUser({ id: userId, data: { departmentId } }));
  };

  const handleDeleteDeptUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this department account?')) {
      try {
        await dispatch(deleteDepartmentUser(userId)).unwrap();
      } catch {
        // ignore
      }
    }
  };

  const handleGeneralInputSubmit = async (e) => {
    e.preventDefault();
    setGeneralInputMessage(null);
    setGeneralInputError(null);
    setStructuredData(null);

    if (!generalInput || generalInput.trim() === '') {
      setGeneralInputError('Please enter some text to submit.');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await api.post('/admin/general-input', { text: generalInput });

      setStructuredData(response.data.structuredData);
      setGeneralInputMessage('Text processed successfully! Review the extracted data below and click "Create Complaint" to submit.');
    } catch (err) {
      setGeneralInputError(err.message || 'Failed to process input.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateComplaint = async () => {
    if (!structuredData) return;

    setGeneralInputMessage(null);
    setGeneralInputError(null);
    setIsProcessing(true);

    try {
      let evidenceUrls = [];
      
      // Upload files if there are any
      if (pendingEvidenceFiles.length > 0) {
        const formData = new FormData();
        pendingEvidenceFiles.forEach(file => {
          formData.append('files', file);
        });
        
        const uploadRes = await api.post('/uploads/multiple', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        evidenceUrls = uploadRes.data.files.map(f => f.url);
      }
      
      const payload = { ...structuredData, evidenceUrls };
      await api.post('/admin/create-complaint', payload);

      setGeneralInputMessage('Complaint submitted successfully to the common channel!');
      
      // Reset form completely
      setTimeout(() => {
        setGeneralInput('');
        setStructuredData(null);
        setGeneralInputMessage(null);
        setGeneralInputError(null);
        setPendingEvidenceFiles([]);
        setEvidenceUploadErrors([]);
      }, 2000);
      
      // Refresh issues list to show the newly created complaint
      dispatch(fetchIssues());
    } catch (err) {
      setGeneralInputError(err.message || 'Failed to create complaint.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStructuredDataChange = (field, value) => {
    setStructuredData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEvidenceFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const errors = [];
    
    const validFiles = files.filter((file) => {
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'video/mp4'];
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Only JPG, PNG, PDF, and MP4 are allowed.`);
        return false;
      }
      // Check file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        errors.push(`${file.name}: File too large. Maximum 50MB per file.`);
        return false;
      }
      return true;
    });

    setEvidenceUploadErrors(errors);

    // Limit to 3 files total
    const totalFiles = pendingEvidenceFiles.length + validFiles.length;
    if (totalFiles > 3) {
      const allowedNewFiles = 3 - pendingEvidenceFiles.length;
      setEvidenceUploadErrors([...errors, `You can only upload 3 files. Adding first ${allowedNewFiles} file(s).`]);
      setPendingEvidenceFiles([...pendingEvidenceFiles, ...validFiles.slice(0, allowedNewFiles)]);
    } else {
      setPendingEvidenceFiles([...pendingEvidenceFiles, ...validFiles]);
    }

    if (errors.length === 0 && validFiles.length > 0) {
      setShowEvidenceModal(false);
    }
  };

  const removeEvidenceFile = (index) => {
    setPendingEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <ImageIcon size={20} />;
    if (file.type === 'video/mp4') return <Film size={20} />;
    if (file.type === 'application/pdf') return <FileText size={20} />;
    return <FileUp size={20} />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDeleteIssue = async (issueId) => {
    if (window.confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
      try {
        await dispatch(deleteIssue(issueId)).unwrap();
      } catch (err) {
        alert(err || 'Failed to delete complaint.');
      }
    }
  };

  const handleReopenToggle = (issueId) => {
    setShowReopenForm((prev) => ({ ...prev, [issueId]: !prev[issueId] }));
  };

  const handleReopenCommentChange = (issueId, value) => {
    setReopenComments((prev) => ({ ...prev, [issueId]: value }));
  };

  const handleReopenSubmit = async (issueId) => {
    const comment = reopenComments[issueId];
    if (!comment || comment.trim() === '') {
      alert('Please provide a reason for reopening this issue.');
      return;
    }

    try {
      await dispatch(reopenIssue({ id: issueId, comment })).unwrap();
      setReopenComments((prev) => ({ ...prev, [issueId]: '' }));
      setShowReopenForm((prev) => ({ ...prev, [issueId]: false }));
      dispatch(fetchIssues());
    } catch (err) {
      alert(err || 'Failed to reopen issue.');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      severity: '',
      department: '',
      status: '',
      recurrence: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const filteredItems = useMemo(() => {
    let filtered = [...items];

    if (filters.severity) {
      filtered = filtered.filter((i) => i.severity === filters.severity);
    }

    if (filters.department) {
      filtered = filtered.filter((i) => i.forwardedTo?._id === filters.department);
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
  }, [items, filters]);

  const statusCounts = useMemo(() => {
    const counts = { open: 0, in_progress: 0, resolved: 0 };
    filteredItems.forEach((i) => {
      if (['completed', 'resolved', 'closed'].includes(i.status)) counts.resolved += 1;
      else if (['in_review', 'reviewing', 'assigned', 'in_progress', 'escalated'].includes(i.status)) counts.in_progress += 1;
      else counts.open += 1;
    });
    return counts;
  }, [filteredItems]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="admin-page">
      <div className="admin-card glass slide-up">
        <div className="admin-header">
          <div className="admin-header-content">
            <div className="admin-icon">
              <Shield size={24} />
            </div>
            <div>
              <h2>Admin Dashboard</h2>
              <p>
                Manage complaints, departments, and monitor the system.
              </p>
            </div>
          </div>
          {user && (
            <span className="admin-user-pill">
              <Shield size={12} />
              {user.name}
            </span>
          )}
        </div>

        <div className="admin-tabs fade-in">
          <button 
            className={`admin-tab ${activeTab === 'complaints' ? 'active' : ''}`}
            onClick={() => setActiveTab('complaints')}
          >
            <FileText size={18} />
            Complaints Management
          </button>
          <button 
            className={`admin-tab ${activeTab === 'general-input' ? 'active' : ''}`}
            onClick={() => setActiveTab('general-input')}
          >
            <MessageSquare size={18} />
            General Input
          </button>
          <button 
            className={`admin-tab ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            <Bell size={18} />
            Alerts & Notices
          </button>
          <button 
            className={`admin-tab ${activeTab === 'departments' ? 'active' : ''}`}
            onClick={() => setActiveTab('departments')}
          >
            <UserPlus size={18} />
            Department Accounts
          </button>
        </div>

        {activeTab === 'complaints' && (
          <>
            <div className="status-summary slide-in-left stagger-1">
          <div className="status-pill pending">
            <AlertTriangle size={16} />
            Open <span>{statusCounts.open}</span>
          </div>
          <div className="status-pill in_review">
            <Clock size={16} />
            In Progress <span>{statusCounts.in_progress}</span>
          </div>
          <div className="status-pill completed">
            <CheckCircle size={16} />
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
                  <label>Department</label>
                  <select 
                    value={filters.department} 
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                  >
                    <option value="">All</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
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
                  Showing {filteredItems.length} of {items.length} complaints
                </span>
              </div>
            </div>
          )}
        </div>

        {status === 'loading' && <p className="loading-text">Loading issues...</p>}
        {error && <p className="admin-error">{error}</p>}

        <div className="issue-list">
          {paginatedItems.map((issue, idx) => (
            <div key={issue._id} className={`issue-card hover-float fade-scale stagger-${Math.min(idx + 1, 5)}`}>
              <div className="issue-header">
                <div>
                  <h3>{issue.issueType}</h3>
                  <p className="issue-meta">
                    <MapPin size={14} />
                    {getIssueLocationText(issue)}
                    <span>•</span>
                    <AlertTriangle size={14} />
                    Severity: <span className={`severity-badge severity-${issue.severity}`}>{issue.severity}</span>
                    <span>•</span>
                    <strong>{(issue.issueTrack || 'civic').toUpperCase()}</strong>
                  </p>
                  <p className="issue-meta">
                    <code>CV-{issue._id.slice(-6).toUpperCase()}</code>
                  </p>
                </div>
                <span className={`status-badge status-${issue.status}`}>
                  {issue.status.replace('_', ' ')}
                </span>
              </div>
              <p className="issue-summary">{issue.summary}</p>
              {getIssueCoordinates(issue) && (
                <div className="issue-map-display">
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
              {issue.forwardedTo && (
                <p className="issue-meta">
                  <Building2 size={14} />
                  Forwarded to: <strong>{issue.forwardedTo.name}</strong>
                </p>
              )}
              {(issue.contactName || issue.contactPhone || issue.contactEmail) && (
                <div className="complainant-details">
                  <h4>
                    <User size={14} />
                    Complainant Details
                  </h4>
                  <div className="contact-info">
                    {issue.contactName && (
                      <p className="contact-item">
                        <User size={14} />
                        <span className="contact-label">Name:</span>
                        <span className="contact-value">{issue.contactName}</span>
                      </p>
                    )}
                    {issue.contactPhone && (
                      <p className="contact-item">
                        <Phone size={14} />
                        <span className="contact-label">Phone:</span>
                        <span className="contact-value">{issue.contactPhone}</span>
                      </p>
                    )}
                    {issue.contactEmail && (
                      <p className="contact-item">
                        <Mail size={14} />
                        <span className="contact-label">Email:</span>
                        <span className="contact-value">{issue.contactEmail}</span>
                      </p>
                    )}
                  </div>
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
              {issue.resolutionEvidence && issue.resolutionEvidence.length > 0 && (
                <div className="resolution-evidence-section">
                  <h4>
                    <ImageIcon size={14} />
                    Resolution Evidence
                  </h4>
                  <div className="resolution-evidence-grid">
                    {issue.resolutionEvidence.map((url, idx) => (
                      <div
                        key={idx}
                        className="resolution-evidence-item"
                        onClick={() => setSelectedImage(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${url}`)}
                      >
                        <img
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${url}`}
                          alt={`Resolution ${idx + 1}`}
                        />
                        <span className="evidence-overlay">
                          <ImageIcon size={16} />
                          View
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {issue.departmentUpdates && issue.departmentUpdates.length > 0 && (
                <div className="issue-timeline">
                  <h4>
                    <MessageSquare size={14} />
                    Department Updates
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
              <div className="issue-actions">
                <select
                  value={issue.forwardedTo?._id || ''}
                  onChange={(e) => handleForward(issue._id, e.target.value)}
                >
                  <option value="">
                    <Send size={14} /> Forward to department...
                  </option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <select
                  value={issue.status}
                  onChange={(e) => handleStatusChange(issue._id, e.target.value)}
                >
                  {unifiedStatuses.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="ghost-btn delete-issue-btn"
                  onClick={() => handleDeleteIssue(issue._id)}
                  title="Delete this complaint"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
              {(issue.status === 'completed' || issue.status === 'resolved') && (
                <div className="reopen-section">
                  {!showReopenForm[issue._id] ? (
                    <button
                      className="reopen-btn"
                      onClick={() => handleReopenToggle(issue._id)}
                    >
                      <RotateCcw size={16} />
                      Reopen Issue
                    </button>
                  ) : (
                    <div className="reopen-form">
                      <textarea
                        rows={3}
                        placeholder="Please explain why you're reopening this issue..."
                        value={reopenComments[issue._id] || ''}
                        onChange={(e) => handleReopenCommentChange(issue._id, e.target.value)}
                      />
                      <div className="reopen-form-actions">
                        <button
                          className="reopen-submit-btn"
                          onClick={() => handleReopenSubmit(issue._id)}
                        >
                          <RotateCcw size={16} />
                          Submit Reopen Request
                        </button>
                        <button
                          className="reopen-cancel-btn"
                          onClick={() => handleReopenToggle(issue._id)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {filteredItems.length === 0 && items.length === 0 && status !== 'loading' && (
            <p className="no-issues">
              <FileText size={24} />
              No issues yet. Ask citizens to submit one via the chat or quick form.
            </p>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredItems.length > 0 && totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            
            <div className="pagination-numbers">
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                // Show first page, last page, current page, and pages around current
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNumber}
                      className={`pagination-number ${currentPage === pageNumber ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (
                  pageNumber === currentPage - 2 ||
                  pageNumber === currentPage + 2
                ) {
                  return <span key={pageNumber} className="pagination-ellipsis">...</span>;
                }
                return null;
              })}
            </div>

            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>

            <span className="pagination-info">
              Page {currentPage} of {totalPages} • {filteredItems.length} total records
            </span>
          </div>
        )}
          </>
        )}

        {activeTab === 'general-input' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <MessageSquare size={20} />
              <h3>General Input</h3>
            </div>
            <p className="admin-section-text">
              Submit unstructured complaint text directly from SMS, WhatsApp, emails, or other sources. 
              The system will process and extract structured data using AI.
            </p>
            <form className="general-input-form" onSubmit={handleGeneralInputSubmit}>
              <textarea
                rows={10}
                placeholder="Paste complaint text here from SMS, WhatsApp, email, etc.&#10;&#10;Example:&#10;Sir, there is a water leakage problem in Sector 12, near the main market. The pipe has been leaking for 3 days now and water is getting wasted. Please fix it urgently. - Rajesh Kumar, 9876543210"
                value={generalInput}
                onChange={(e) => setGeneralInput(e.target.value)}
                className="general-input-textarea"
                disabled={isProcessing}
              />
              <div className="form-actions-row">
                <button 
                  type="button" 
                  className="ghost-btn evidence-btn"
                  onClick={() => setShowEvidenceModal(true)}
                  disabled={isProcessing}
                >
                  <Paperclip size={16} />
                  Attach Evidence
                  {pendingEvidenceFiles.length > 0 && (
                    <span className="badge">{pendingEvidenceFiles.length}</span>
                  )}
                </button>
                <button type="submit" className="secondary-btn" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Clock size={16} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Process Input
                    </>
                  )}
                </button>
              </div>
              
              {pendingEvidenceFiles.length > 0 && (
                <div className="attached-files-preview">
                  <h4>Attached Files ({pendingEvidenceFiles.length}/3)</h4>
                  <div className="files-preview-list">
                    {pendingEvidenceFiles.map((file, index) => (
                      <div key={index} className="file-preview-item">
                        {getFileIcon(file)}
                        <span className="file-preview-name">{file.name}</span>
                        <button 
                          type="button"
                          className="remove-file-btn" 
                          onClick={() => removeEvidenceFile(index)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
            {generalInputMessage && (
              <p className="admin-message ok">
                <CheckCircle size={16} />
                {generalInputMessage}
              </p>
            )}
            {generalInputError && (
              <p className="admin-message error">
                <AlertTriangle size={16} />
                {generalInputError}
              </p>
            )}

            {structuredData && (
              <div className="structured-data-section">
                <div className="structured-data-header">
                  <h4>
                    <CheckCircle size={20} />
                    Verify & Submit to Common Channel
                  </h4>
                  <p>Review and edit the extracted information before submitting to the common complaints channel (same as chat and quick submit form).</p>
                </div>
                <div className="structured-data-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Issue Type *</label>
                      <input
                        type="text"
                        value={structuredData.issueType}
                        onChange={(e) => handleStructuredDataChange('issueType', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Severity *</label>
                      <select
                        value={structuredData.severity}
                        onChange={(e) => handleStructuredDataChange('severity', e.target.value)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Location *</label>
                      <input
                        type="text"
                        value={structuredData.location}
                        onChange={(e) => handleStructuredDataChange('location', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Landmark</label>
                      <input
                        type="text"
                        value={structuredData.landmark}
                        onChange={(e) => handleStructuredDataChange('landmark', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Summary *</label>
                      <input
                        type="text"
                        value={structuredData.summary}
                        onChange={(e) => handleStructuredDataChange('summary', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Description *</label>
                      <textarea
                        rows={5}
                        value={structuredData.description}
                        onChange={(e) => handleStructuredDataChange('description', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Impact</label>
                      <textarea
                        rows={3}
                        value={structuredData.impact}
                        onChange={(e) => handleStructuredDataChange('impact', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Recurrence</label>
                      <select
                        value={structuredData.recurrence}
                        onChange={(e) => handleStructuredDataChange('recurrence', e.target.value)}
                      >
                        <option value="new">New</option>
                        <option value="recurring">Recurring</option>
                        <option value="ongoing">Ongoing</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Preferred Contact Method</label>
                      <select
                        value={structuredData.preferredContactMethod}
                        onChange={(e) => handleStructuredDataChange('preferredContactMethod', e.target.value)}
                      >
                        <option value="none">None</option>
                        <option value="phone">Phone</option>
                        <option value="email">Email</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Contact Name</label>
                      <input
                        type="text"
                        value={structuredData.contactName}
                        onChange={(e) => handleStructuredDataChange('contactName', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Contact Phone</label>
                      <input
                        type="text"
                        value={structuredData.contactPhone}
                        onChange={(e) => handleStructuredDataChange('contactPhone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Contact Email</label>
                      <input
                        type="email"
                        value={structuredData.contactEmail}
                        onChange={(e) => handleStructuredDataChange('contactEmail', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="secondary-btn create-complaint-btn"
                      onClick={handleCreateComplaint}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Clock size={16} />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Submit to Common Channel
                        </>
                      )}
                    </button>
                    <button 
                      type="button" 
                      className="ghost-btn"
                      onClick={() => {
                        setStructuredData(null);
                        setGeneralInput('');
                        setGeneralInputMessage(null);
                        setGeneralInputError(null);
                      }}
                      disabled={isProcessing}
                    >
                      <X size={16} />
                      Cancel & Reset
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="admin-section">
          <div className="admin-section-header">
            <UserPlus size={20} />
            <h3>Department Accounts</h3>
          </div>
          <p className="admin-section-text">
            Create and manage department login accounts that will receive forwarded
            complaints.
          </p>
          <form className="dept-user-form" onSubmit={handleCreateDeptUser}>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={newDeptUser.name}
              onChange={onChangeNewDeptUser}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={newDeptUser.email}
              onChange={onChangeNewDeptUser}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={newDeptUser.password}
              onChange={onChangeNewDeptUser}
            />
            <input
              type="text"
              name="departmentName"
              placeholder="Department Name (e.g., Water Supply, Roads)"
              value={newDeptUser.departmentName}
              onChange={onChangeNewDeptUser}
            />
            <button type="submit" className="secondary-btn">
              <UserPlus size={16} />
              Create Account
            </button>
          </form>
          {deptUserMessage && (
            <p className="admin-message ok">
              <CheckCircle size={16} />
              {deptUserMessage}
            </p>
          )}
          {deptUserError && (
            <p className="admin-message error">
              <AlertTriangle size={16} />
              {deptUserError}
            </p>
          )}

          <div className="dept-users-list">
            {departmentUsers.length === 0 && (
              <p className="no-issues">
                <Building2 size={20} />
                No department accounts yet.
              </p>
            )}
            {departmentUsers.map((u) => (
              <div key={u._id} className="dept-user-row hover-float">
                <div className="dept-user-main">
                  <div className="dept-user-name">{u.name}</div>
                  <div className="dept-user-email">{u.email}</div>
                </div>
                <div className="dept-user-controls">
                  <select
                    value={u.department?._id || ''}
                    onChange={(e) => handleChangeDeptForUser(u._id, e.target.value)}
                  >
                    <option value="">Assign department...</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="dept-user-delete ghost-btn"
                    onClick={() => handleDeleteDeptUser(u._id)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {activeTab === 'alerts' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <Bell size={20} />
              <h3>Alerts & Notices</h3>
            </div>
            <p className="admin-section-text">
              Create and manage system-wide alerts that appear on the landing page. Use this to notify citizens about important updates, maintenance, or urgent issues.
            </p>

            {!showAlertForm ? (
              <button 
                className="secondary-btn"
                onClick={() => {
                  setShowAlertForm(true);
                  setEditingAlert(null);
                  setAlertForm({ title: '', message: '', type: 'info', endDate: '' });
                  setAlertMessage(null);
                  setAlertError(null);
                }}
              >
                <Plus size={16} />
                Create New Alert
              </button>
            ) : (
              <form className="alert-form" onSubmit={handleCreateAlert}>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Alert Title *</label>
                    <input
                      type="text"
                      placeholder="e.g., System Maintenance Scheduled"
                      value={alertForm.title}
                      onChange={(e) => handleAlertFormChange('title', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Message *</label>
                    <textarea
                      rows={4}
                      placeholder="Detailed message about the alert..."
                      value={alertForm.message}
                      onChange={(e) => handleAlertFormChange('message', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Alert Type</label>
                    <select
                      value={alertForm.type}
                      onChange={(e) => handleAlertFormChange('type', e.target.value)}
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>End Date (Optional)</label>
                    <input
                      type="date"
                      value={alertForm.endDate}
                      onChange={(e) => handleAlertFormChange('endDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="secondary-btn">
                    <Save size={16} />
                    {editingAlert ? 'Update Alert' : 'Create Alert'}
                  </button>
                  <button 
                    type="button" 
                    className="ghost-btn"
                    onClick={() => {
                      setShowAlertForm(false);
                      setEditingAlert(null);
                      setAlertForm({ title: '', message: '', type: 'info', endDate: '' });
                    }}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {alertMessage && (
              <p className="admin-message ok">
                <CheckCircle size={16} />
                {alertMessage}
              </p>
            )}
            {alertError && (
              <p className="admin-message error">
                <AlertTriangle size={16} />
                {alertError}
              </p>
            )}

            {alertsLoading ? (
              <p className="loading-text">Loading alerts...</p>
            ) : (
              <div className="alerts-list">
                {alerts.length === 0 && (
                  <p className="no-issues">
                    <Bell size={20} />
                    No alerts created yet.
                  </p>
                )}
                {alerts.map((alert) => (
                  <div key={alert._id} className={`alert-card hover-float alert-type-${alert.type}`}>
                    <div className="alert-card-header">
                      <div>
                        <h4>{alert.title}</h4>
                        <span className={`alert-badge alert-badge-${alert.type}`}>
                          {alert.type}
                        </span>
                        {alert.isActive ? (
                          <span className="alert-status-badge active">Active</span>
                        ) : (
                          <span className="alert-status-badge inactive">Inactive</span>
                        )}
                      </div>
                    </div>
                    <p className="alert-message">{alert.message}</p>
                    <div className="alert-meta">
                      <span>Created: {formatDateTime(alert.createdAt)}</span>
                      {alert.endDate && (
                        <span>Expires: {formatDateTime(alert.endDate)}</span>
                      )}
                    </div>
                    <div className="alert-actions">
                      <button
                        className="ghost-btn"
                        onClick={() => handleEditAlert(alert)}
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button
                        className="ghost-btn"
                        onClick={() => handleToggleAlertStatus(alert._id, alert.isActive)}
                      >
                        {alert.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="ghost-btn delete-issue-btn"
                        onClick={() => handleDeleteAlert(alert._id)}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Evidence Upload Modal */}
      {showEvidenceModal && (
        <div className="modal-overlay fade-in" onClick={() => setShowEvidenceModal(false)}>
          <div className="modal-content evidence-modal scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Attach Evidence</h3>
              <button className="modal-close" onClick={() => setShowEvidenceModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-info">
                Upload up to 3 files (JPG, PNG, PDF, or MP4). Max 50MB per file.
              </p>
              
              {evidenceUploadErrors.length > 0 && (
                <div className="upload-errors">
                  {evidenceUploadErrors.map((error, i) => (
                    <p key={i} className="error-text">{error}</p>
                  ))}
                </div>
              )}

              <div className="file-upload-area">
                <label className={`file-upload-label ${pendingEvidenceFiles.length >= 3 ? 'disabled' : ''}`}>
                  <FileUp size={32} />
                  <span>
                    {pendingEvidenceFiles.length >= 3 
                      ? 'Maximum 3 files reached. Remove files to add new ones.' 
                      : 'Click to select files'}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.mp4"
                    onChange={handleEvidenceFileSelect}
                    disabled={pendingEvidenceFiles.length >= 3}
                  />
                </label>
              </div>

              {pendingEvidenceFiles.length > 0 && (
                <div className="selected-files-list">
                  <h4>Attached Files ({pendingEvidenceFiles.length}/3)</h4>
                  <p className="upload-info">Files will be uploaded when you submit the complaint</p>
                  {pendingEvidenceFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-info">
                        {getFileIcon(file)}
                        <div>
                          <p className="file-name">{file.name}</p>
                          <p className="file-size">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        className="remove-file-btn" 
                        onClick={() => removeEvidenceFile(index)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="primary-btn" 
                onClick={() => setShowEvidenceModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content">
            <img src={selectedImage} alt="Resolution Evidence" />
            <button className="image-modal-close" onClick={() => setSelectedImage(null)}>
              ×
            </button>
          </div>
        </div>
      )}

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

export default AdminPage;
