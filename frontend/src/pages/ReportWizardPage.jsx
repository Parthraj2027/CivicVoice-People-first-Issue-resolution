import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Droplets,
  FileUp,
  Lightbulb,
  Loader2,
  Pill,
  Scale,
  TreePine,
  Trash2,
  User,
  Users,
  Waves,
  Home,
  ShieldAlert,
  Utensils,
  Accessibility,
  PersonStanding,
  RefreshCcw,
  CheckCircle2,
  MapPin,
  HeartPulse,
} from 'lucide-react';
import api from '@/lib/apiClient';
import CategoryGrid from '@/components/library/CategoryGrid';
import AnonymousToggle from '@/components/library/AnonymousToggle';
import LocationPicker from '@/components/LocationPicker';
import '@/styles/ReportWizardPage.css';

const civicCategories = [
  { value: 'pothole', label: 'Pothole', icon: RefreshCcw },
  { value: 'streetlight', label: 'Streetlight', icon: Lightbulb },
  { value: 'sewage', label: 'Sewage', icon: Waves },
  { value: 'garbage', label: 'Garbage', icon: Trash2 },
  { value: 'water', label: 'Water', icon: Droplets },
  { value: 'other', label: 'Other', icon: AlertTriangle },
];

const socialCategories = [
  { value: 'child_labour', label: 'Child Labour', icon: User },
  { value: 'womens_safety', label: 'Women Safety', icon: ShieldAlert },
  { value: 'homelessness', label: 'Homelessness', icon: Home },
  { value: 'education', label: 'Education', icon: BookOpen },
  { value: 'healthcare', label: 'Healthcare', icon: HeartPulse },
  { value: 'environment', label: 'Environment', icon: TreePine },
  { value: 'elder_neglect', label: 'Elder Neglect', icon: Users },
  { value: 'hunger', label: 'Hunger', icon: Utensils },
  { value: 'disability', label: 'Disability', icon: Accessibility },
  { value: 'mental_health', label: 'Mental Health', icon: Brain },
  { value: 'discrimination', label: 'Discrimination', icon: Scale },
  { value: 'substance_abuse', label: 'Substance Abuse', icon: Pill },
];

const urgencyOptions = ['low', 'medium', 'high', 'emergency'];

const formatNearbyLocation = (issue) => {
  if (!issue) return 'Location unavailable';
  const source = issue.location;
  if (typeof source === 'string') return source;
  if (source && typeof source === 'object') {
    return [source.address, source.city, source.state, source.pincode].filter(Boolean).join(', ') || 'Location unavailable';
  }
  return 'Location unavailable';
};

const ReportWizardPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preferredNgoId = searchParams.get('ngo') || '';
  const initialType = preferredNgoId
    ? 'social'
    : searchParams.get('type') === 'social'
      ? 'social'
      : searchParams.get('type') === 'civic'
        ? 'civic'
        : '';

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [preferredNgoLoading, setPreferredNgoLoading] = useState(false);
  const [preferredNgo, setPreferredNgo] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [nearbyIssues, setNearbyIssues] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [form, setForm] = useState({
    track: initialType,
    category: '',
    title: '',
    description: '',
    isAnonymous: false,
    urgencyLevel: 'medium',
    location: null,
    address: '',
    evidenceFiles: [],
    witnessStatement: '',
  });

  const steps = [
    'Choose Track',
    'Describe Issue',
    'Location',
    'Evidence',
    'Review & Submit',
  ];

  const activeCategories = form.track === 'social' ? socialCategories : civicCategories;
  const selectedCategory = activeCategories.find((item) => item.value === form.category);

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleTrackPick = (track) => {
    updateForm({ track, category: '', title: '' });
  };

  const handleCategorySelect = (category) => {
    const label = activeCategories.find((item) => item.value === category)?.label || category;
    updateForm({ category, title: label });
    setStep(2);
  };

  const handleAiAssist = async () => {
    if (!form.description.trim()) return;
    setAiLoading(true);
    setError('');

    try {
      const response = await api.post('/admin/general-input', { text: form.description });
      const structured = response.data?.structuredData || {};
      updateForm({
        title: structured.title || form.title,
        description: structured.description || form.description,
        urgencyLevel: structured.urgencyLevel || form.urgencyLevel,
        category: structured.socialCategory || structured.civicCategory || form.category,
        address: structured.location || form.address,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'AI helper is unavailable for your account right now.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const selected = Array.from(event.target.files || []).slice(0, 3);
    updateForm({ evidenceFiles: selected });
  };

  const evidencePreview = useMemo(() => {
    return form.evidenceFiles.map((file) => ({
      name: file.name,
      type: file.type,
      sizeMb: (file.size / (1024 * 1024)).toFixed(1),
    }));
  }, [form.evidenceFiles]);

  const canProceed = () => {
    if (step === 1) return Boolean(form.track && form.category);
    if (step === 2) return Boolean(form.description.trim());
    if (step === 3) return Boolean(form.location || form.address);
    return true;
  };

  useEffect(() => {
    if (!preferredNgoId) {
      setPreferredNgo(null);
      return;
    }

    let isCancelled = false;

    const loadPreferredNgo = async () => {
      setPreferredNgoLoading(true);
      try {
        const response = await api.get(`/ngos/${preferredNgoId}`);
        if (!isCancelled) {
          setPreferredNgo(response.data?.ngo || null);
          setForm((prev) => {
            if (prev.track) return prev;
            return { ...prev, track: 'social' };
          });
        }
      } catch {
        if (!isCancelled) {
          setPreferredNgo(null);
        }
      } finally {
        if (!isCancelled) {
          setPreferredNgoLoading(false);
        }
      }
    };

    loadPreferredNgo();

    return () => {
      isCancelled = true;
    };
  }, [preferredNgoId]);

  useEffect(() => {
    const lat = form.location?.latitude;
    const lng = form.location?.longitude;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      setNearbyIssues([]);
      return;
    }

    let isCancelled = false;

    const loadNearby = async () => {
      setLoadingNearby(true);
      try {
        const response = await api.get('/public/nearby', {
          params: {
            lat,
            lng,
            radiusKm: 8,
            limit: 12,
          },
        });
        if (!isCancelled) {
          setNearbyIssues(Array.isArray(response.data?.items) ? response.data.items : []);
        }
      } catch {
        if (!isCancelled) {
          setNearbyIssues([]);
        }
      } finally {
        if (!isCancelled) {
          setLoadingNearby(false);
        }
      }
    };

    loadNearby();

    return () => {
      isCancelled = true;
    };
  }, [form.location?.latitude, form.location?.longitude]);

  const submitIssue = async () => {
    setSubmitting(true);
    setError('');

    try {
      let created;
      if (form.track === 'social') {
        const payload = {
          title: form.title,
          description: form.description,
          socialCategory: form.category,
          urgencyLevel: form.urgencyLevel,
          severity: form.urgencyLevel,
          isAnonymous: form.isAnonymous,
          location: {
            address: form.address,
            lat: form.location?.latitude,
            lng: form.location?.longitude,
          },
          witnessStatement: form.witnessStatement,
          evidenceUrls: evidencePreview.map((item) => item.name),
        };
        if (preferredNgo?._id) {
          payload.preferredNgoId = preferredNgo._id;
        }
        const response = await api.post('/social-issues', payload);
        created = response.data?.issue;
      } else {
        const payload = {
          issueType: form.category,
          description: form.description,
          severity: form.urgencyLevel === 'emergency' ? 'critical' : form.urgencyLevel,
          location: form.address || 'Location added via map',
          geoLocation: form.location || undefined,
          evidenceUrls: evidencePreview.map((item) => item.name),
        };
        const response = await api.post('/issues', payload);
        created = response.data?.issue;
      }

      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.65 },
      });

      setSuccess({
        id: created?._id,
        publicId: created?.publicId || 'Generated after processing',
      });
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach server. Start backend on port 4000 and check your internet/VPN/firewall.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to submit issue.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="report-wizard-page success-view">
        <div className="wizard-card success-card">
          <CheckCircle2 size={56} />
          <h1>Issue submitted successfully</h1>
          <p>Tracking ID: {success.publicId}</p>
          <div className="success-actions">
            <button type="button" onClick={() => navigate(success.id ? `/track/${success.id}` : '/')}>
              Track your issue
            </button>
            <button type="button" className="ghost" onClick={() => navigate('/')}>
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-wizard-page">
      <section className="wizard-top">
        <button type="button" className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1>Report an issue</h1>
        <p>Civic issues go to departments. Social issues go to NGO partners and helplines.</p>
      </section>

      {preferredNgoLoading ? (
        <section className="wizard-card ngo-handoff-banner">
          <p>Loading selected NGO...</p>
        </section>
      ) : null}

      {preferredNgo && form.track === 'social' ? (
        <section className="wizard-card ngo-handoff-banner">
          <div className="ngo-handoff-title">
            <MapPin size={16} />
            <strong>Support will be routed to {preferredNgo.name}</strong>
          </div>
          <p>{preferredNgo.description || 'This NGO has been selected from the directory for direct help.'}</p>
        </section>
      ) : null}

      <section className="wizard-stepper" aria-label="Report progress">
        {steps.map((label, index) => (
          <div key={label} className={`step-pill ${index + 1 <= step ? 'active' : ''}`}>
            <span>{index + 1}</span>
            <small>{label}</small>
          </div>
        ))}
      </section>

      <section className="wizard-card step-card">
        {step === 1 && (
          <div className="step-content">
            <h2>Choose your track</h2>
            <div className="track-cards">
              <button type="button" className={`track-card civic ${form.track === 'civic' ? 'selected' : ''}`} onClick={() => handleTrackPick('civic')}>
                <strong>Civic Issue</strong>
                <span>Government departments resolve this.</span>
              </button>
              <button type="button" className={`track-card social ${form.track === 'social' ? 'selected' : ''}`} onClick={() => handleTrackPick('social')}>
                <strong>Social Issue</strong>
                <span>NGOs respond first, then escalation if needed.</span>
              </button>
            </div>
            {form.track ? (
              <>
                <h3>{form.track === 'social' ? 'Select social category' : 'Select civic category'}</h3>
                <CategoryGrid
                  categories={activeCategories}
                  selected={form.category}
                  onSelect={handleCategorySelect}
                  type={form.track}
                />
              </>
            ) : null}
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <h2>Describe the issue</h2>
            <textarea
              value={form.description}
              maxLength={1000}
              onChange={(event) => updateForm({ description: event.target.value })}
              placeholder="Describe what you see..."
              rows={8}
            />
            <div className="meta-row">
              <small>{form.description.length}/1000</small>
              <button type="button" className="ghost" onClick={handleAiAssist} disabled={aiLoading}>
                {aiLoading ? <Loader2 size={14} className="spin" /> : <Lightbulb size={14} />} Let AI help
              </button>
            </div>
            <AnonymousToggle value={form.isAnonymous} onChange={(next) => updateForm({ isAnonymous: next })} />
            <div className="urgency-row">
              {urgencyOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`urgency-pill ${form.urgencyLevel === option ? 'active' : ''}`}
                  onClick={() => updateForm({ urgencyLevel: option })}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <h2>Add location</h2>
            <LocationPicker
              value={form.location}
              onChange={(next) => updateForm({ location: next })}
              nearbyIssues={nearbyIssues}
              onOpenIssue={(issue) => navigate(`/track/${issue._id}`)}
            />
            <label className="field">
              Address
              <input
                type="text"
                value={form.address}
                onChange={(event) => updateForm({ address: event.target.value })}
                placeholder="Address, city, pincode"
              />
            </label>
            <div className="nearby-issues-panel">
              <div className="nearby-issues-header">
                <h3>Nearby reported issues</h3>
                <span>{loadingNearby ? 'Loading...' : `${nearbyIssues.length} found`}</span>
              </div>
              {nearbyIssues.length === 0 && !loadingNearby ? (
                <p className="nearby-empty">No nearby reports within 8 km yet.</p>
              ) : null}
              <div className="nearby-list">
                {nearbyIssues.map((issue) => (
                  <button key={issue._id} type="button" className="nearby-item" onClick={() => navigate(`/track/${issue._id}`)}>
                    <div>
                      <strong>{issue.title || issue.issueType || 'Reported issue'}</strong>
                      <p>{formatNearbyLocation(issue)}</p>
                    </div>
                    <div>
                      <small className={`nearby-track ${issue.issueTrack || 'civic'}`}>{issue.issueTrack || 'civic'}</small>
                      <small>{typeof issue.distanceKm === 'number' ? `${issue.distanceKm.toFixed(2)} km` : ''}</small>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step-content">
            <h2>Add evidence</h2>
            <label className="upload-zone">
              <FileUp size={20} />
              <span>Upload JPG, PNG, PDF or MP4 files (max 3)</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.mp4"
                multiple
                onChange={handleFileSelect}
              />
            </label>
            <div className="preview-list">
              {evidencePreview.map((item) => (
                <div key={item.name} className="preview-item">
                  <strong>{item.name}</strong>
                  <small>{item.type || 'file'} • {item.sizeMb} MB</small>
                </div>
              ))}
            </div>
            <label className="field">
              Witness statement (optional)
              <textarea
                value={form.witnessStatement}
                onChange={(event) => updateForm({ witnessStatement: event.target.value })}
                rows={4}
                placeholder="Add witness statement from someone present"
              />
            </label>
          </div>
        )}

        {step === 5 && (
          <div className="step-content">
            <h2>Review & submit</h2>
            <div className="review-grid">
              <div className="review-card"><strong>Track</strong><span>{form.track}</span></div>
              {form.track === 'social' && preferredNgo ? <div className="review-card"><strong>Preferred NGO</strong><span>{preferredNgo.name}</span></div> : null}
              <div className="review-card"><strong>Category</strong><span>{selectedCategory?.label || form.category}</span></div>
              <div className="review-card"><strong>Urgency</strong><span>{form.urgencyLevel}</span></div>
              <div className="review-card"><strong>Anonymous</strong><span>{form.isAnonymous ? 'Yes' : 'No'}</span></div>
              <div className="review-card full"><strong>Description</strong><span>{form.description}</span></div>
              <div className="review-card full"><strong>Address</strong><span>{form.address || 'Pinned on map'}</span></div>
              <div className="review-card full"><strong>Evidence</strong><span>{evidencePreview.length} file(s)</span></div>
            </div>
            <button type="button" className="submit-btn" onClick={submitIssue} disabled={submitting}>
              {submitting ? <Loader2 size={16} className="spin" /> : <ArrowRight size={16} />} Submit issue
            </button>
          </div>
        )}
      </section>

      {error ? <p className="wizard-error" role="alert">{error}</p> : null}

      <section className="wizard-nav">
        <button type="button" onClick={() => setStep((prev) => Math.max(1, prev - 1))} disabled={step === 1 || submitting}>Previous</button>
        <button type="button" onClick={() => setStep((prev) => Math.min(5, prev + 1))} disabled={step === 5 || !canProceed() || submitting}>Next</button>
      </section>
    </div>
  );
};

export default ReportWizardPage;
