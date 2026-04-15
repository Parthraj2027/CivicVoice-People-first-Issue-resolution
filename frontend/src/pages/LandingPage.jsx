import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  ChevronRight,
  Clock3,
  FileText,
  Globe2,
  HeartHandshake,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import api from '@/lib/apiClient';
import '@/styles/LandingPage.css';

const AnimatedNumber = ({ target = 0, suffix = '' }) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const stepTime = 30;
    const totalSteps = Math.ceil(duration / stepTime);
    const increment = target / totalSteps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.round(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target]);

  return <strong>{value.toLocaleString()}{suffix}</strong>;
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [impact, setImpact] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/public/impact');
        setImpact(response.data);
        setRecent(response.data?.recentIssues || []);
      } catch (error) {
        console.error('Failed to load public impact:', error);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => ([
    { label: 'Issues resolved', value: impact?.resolvedTotal || 0 },
    { label: 'Active NGOs', value: impact?.ngosActive || 0 },
    { label: 'Cities covered', value: 48 },
    { label: 'Resolution rate', value: impact?.resolutionRate || 0, suffix: '%' },
  ]), [impact]);

  const issuePillars = [
    {
      title: 'Civic issues',
      copy: 'Roads, water, drainage, sanitation, transport, and other public service needs move into the correct departmental queue.',
      icon: <Globe2 size={18} />,
    },
    {
      title: 'Social issues',
      copy: 'Sensitive cases reach NGOs and helplines first, with escalation when a response needs public support.',
      icon: <HeartHandshake size={18} />,
    },
    {
      title: 'Transparent follow-up',
      copy: 'Every report keeps its status, timeline, and accountability visible so people know what changed.',
      icon: <BadgeCheck size={18} />,
    },
  ];

  const storyCards = [
    {
      title: 'Calm reporting',
      copy: 'A guided flow helps citizens describe the issue, add location, and share evidence without friction.',
      image: '/assets/landing/Civic-Engagement.jpg',
      alt: 'People participating in civic engagement activity',
    },
    {
      title: 'Human follow-up',
      copy: 'Departments, NGOs, and volunteers stay aligned on one timeline instead of scattered chat threads.',
      image: '/assets/landing/Youth.png',
      alt: 'Community youth support network',
    },
    {
      title: 'Accountable movement',
      copy: 'Public tracking and resolution history make progress easier to trust, verify, and share.',
      image: '/assets/landing/civic-responsibility.webp',
      alt: 'Civic responsibility illustration',
    },
  ];

  const spotlightIssues = recent.length > 0
    ? recent.slice(0, 4)
    : [
        { _id: 'placeholder-1', title: 'Streetlight outage reported in city center', issueTrack: 'civic', status: 'pending' },
        { _id: 'placeholder-2', title: 'Women safety support request matched to NGO', issueTrack: 'social', status: 'in_review' },
        { _id: 'placeholder-3', title: 'Drainage overflow raised before monsoon', issueTrack: 'civic', status: 'assigned' },
        { _id: 'placeholder-4', title: 'Community food support request routed to volunteers', issueTrack: 'social', status: 'resolved' },
      ];

  const accessTarget = (path) => {
    // Always funnel landing actions through login/sign-in first.
    navigate('/login', { state: { from: path } });
  };

  const openJagruk = () => {
    window.dispatchEvent(new CustomEvent('jagruk:open'));
  };

  const openLoginSelector = () => {
    navigate('/login');
  };

  return (
    <div className="cv-landing">
      <header className="cv-landing__header">
        <button type="button" className="cv-brand" onClick={() => navigate('/')}>
          <span className="cv-brand__mark">CV</span>
          <span>
            CivicVoice
            <strong>People-first issue resolution</strong>
          </span>
        </button>

        <nav className="cv-header-links" aria-label="Landing sections">
          <a href="#who-we-are">Who we are</a>
          <a href="#what-we-do">What we do</a>
          <a href="#resources">Resources</a>
        </nav>

        <div className="cv-header-actions">
          <button type="button" className="ghost" onClick={openJagruk}>Ask Jagruk</button>
          <button type="button" className="ghost" onClick={openLoginSelector}>Sign in</button>
          <button type="button" className="solid" onClick={openLoginSelector}>Login</button>
        </div>
      </header>

      <main>
        <section className="cv-hero">
          <div className="cv-hero__copy">
            <span className="cv-kicker">CIVIC ENGAGEMENT FOR MODERN CITIES</span>
            <h1>Report civic and social issues in a calmer, clearer way.</h1>
            <p>
              CivicVoice turns public complaints into a simple flow: understand the issue, choose the right track,
              and keep everyone aligned until it is resolved.
            </p>

            <div className="cv-hero__actions">
              <button type="button" className="primary" onClick={() => accessTarget('/report?type=civic')}>
                Preview civic issue <ArrowRight size={16} />
              </button>
              <button type="button" className="secondary" onClick={() => accessTarget('/report?type=social')}>
                Preview social issue <ArrowRight size={16} />
              </button>
              <button type="button" className="secondary" onClick={openJagruk}>
                Talk to Jagruk <ArrowRight size={16} />
              </button>
            </div>

            <div className="cv-hero__notes">
              <div>
                <Sparkles size={16} />
                <span>Simple reporting</span>
              </div>
              <div>
                <ShieldCheck size={16} />
                <span>Role-aware routing</span>
              </div>
              <div>
                <LayoutGrid size={16} />
                <span>One public timeline</span>
              </div>
            </div>
          </div>

          <div className="cv-hero__panel">
            <div className="cv-hero__image-grid" aria-label="CivicVoice preview visuals">
              <img src="/assets/landing/OIP.webp" alt="Citizen support and social response" loading="lazy" />
              <img src="/assets/landing/Hum.jpg" alt="Community members discussing local issues" loading="lazy" />
              <img src="/assets/landing/Civic-Engagement.jpg" alt="Citizens engaged in city problem solving" loading="lazy" />
            </div>

            <div className="cv-hero__panel-card">
              <div>
                <Clock3 size={18} />
                <strong>Fast routing</strong>
              </div>
              <p>Social issues go to NGO response. Civic issues go to departments. The right people see it first.</p>
            </div>
          </div>
        </section>

        <section className="cv-stat-strip" aria-label="Platform impact counters">
          {stats.map((stat) => (
            <article key={stat.label} className="cv-stat-card">
              <AnimatedNumber target={stat.value} suffix={stat.suffix || ''} />
              <span>{stat.label}</span>
            </article>
          ))}
        </section>

        <section id="who-we-are" className="cv-section">
          <div className="cv-section__heading">
            <span>Who we are</span>
            <h2>Built to make public service feel organized, not exhausting.</h2>
          </div>

          <div className="cv-pillar-grid">
            {issuePillars.map((pillar) => (
              <article key={pillar.title} className="cv-pillar-card">
                <div className="cv-pillar-card__icon">{pillar.icon}</div>
                <h3>{pillar.title}</h3>
                <p>{pillar.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="what-we-do" className="cv-section cv-section--split">
          <article className="cv-feature-card">
            <div className="cv-feature-card__eyebrow">What we solve</div>
            <h2>Every issue follows a clear path from report to resolution.</h2>
            <p>
              Citizens can open a report, attach context, and know whether the issue is civic or social. Each track
              lands with the right responders and keeps a visible record of progress.
            </p>
            <button type="button" className="inline-link" onClick={() => accessTarget('/report?type=civic')}>
              Start with a civic report <ChevronRight size={16} />
            </button>
          </article>

          <div className="cv-track-grid">
            <button type="button" className="cv-track-card civic" onClick={() => accessTarget('/report?type=civic')}>
              <FileText size={20} />
              <strong>Civic issue</strong>
              <span>Roads, water, drainage, sanitation, transport, and other public service needs.</span>
              <ArrowUpRight size={16} />
            </button>

            <button type="button" className="cv-track-card social" onClick={() => accessTarget('/report?type=social')}>
              <Users size={20} />
              <strong>Social issue</strong>
              <span>Safety, care, support, and vulnerable community cases that need human response.</span>
              <ArrowUpRight size={16} />
            </button>
          </div>
        </section>

        <section className="cv-section">
          <div className="cv-section__heading">
            <span>How it works</span>
            <h2>A short flow that keeps people informed without extra noise.</h2>
          </div>

          <div className="cv-steps">
            <article>
              <strong>01</strong>
              <h3>Describe the issue</h3>
              <p>Add the problem, location, and supporting evidence so the report starts with context.</p>
            </article>
            <article>
              <strong>02</strong>
              <h3>Route by category</h3>
              <p>The platform separates civic and social cases and sends them to the right workflow immediately.</p>
            </article>
            <article>
              <strong>03</strong>
              <h3>Track progress publicly</h3>
              <p>Status updates stay visible so users can see when the case is reviewed, assigned, or resolved.</p>
            </article>
            <article>
              <strong>04</strong>
              <h3>Close the loop</h3>
              <p>Resolution details, follow-up notes, and impact data help build trust over time.</p>
            </article>
          </div>
        </section>

        <section id="resources" className="cv-section cv-section--resources">
          <div className="cv-resources__feed">
            <div className="cv-section__heading compact">
              <span>Recent issues</span>
              <h2>Public signals that show the system moving.</h2>
            </div>

            <div className="cv-recent-grid">
              {spotlightIssues.map((item, index) => (
                <article key={`${item._id}-${index}`} className="cv-recent-card">
                  <span className={`cv-track-badge ${item.issueTrack === 'social' ? 'social' : 'civic'}`}>
                    {item.issueTrack || 'issue'}
                  </span>
                  <h3>{item.title || item.issueType || 'Issue reported'}</h3>
                  <p>{item.description || 'A public case recently entered the system.'}</p>
                  <footer>
                    <strong>{item.status || 'pending'}</strong>
                    <button type="button" onClick={() => accessTarget(`/track/${item.publicId || item._id}`)}>
                      Track
                    </button>
                  </footer>
                </article>
              ))}
            </div>
          </div>

          <aside className="cv-resources__side">
            <div className="cv-resource-panel">
              <div className="cv-section__heading compact">
                <span>Resources</span>
                <h2>Helpful entry points for people and teams.</h2>
              </div>

              <ul>
                <li><span>•</span> Guided issue reporting for civic and social cases</li>
                <li><span>•</span> Public tracking for transparency and follow-up</li>
                <li><span>•</span> Login-based access for citizen, department, and admin roles</li>
              </ul>

              <div className="cv-resource-panel__actions">
                <button type="button" onClick={() => accessTarget('/report?type=civic')}>Start civic report</button>
                <button type="button" onClick={() => accessTarget('/report?type=social')}>Start social report</button>
              </div>
            </div>

            <div className="cv-resource-panel soft">
              <h3>NGO partners</h3>
              <div className="cv-partner-list">
                {['Asha Foundation', 'Bright Steps', 'Sahyog Trust', 'Jan Seva', 'CareBridge', 'Nayi Disha'].map((logo) => (
                  <span key={logo}>{logo}</span>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="cv-section">
          <div className="cv-cta">
            <div>
              <span>Ready when you are</span>
              <h2>Start with Sign in or Login, then continue to the right role flow.</h2>
            </div>
            <div className="cv-cta__actions">
              <button type="button" className="primary" onClick={openLoginSelector}>Sign in</button>
              <button type="button" className="secondary" onClick={openLoginSelector}>Login</button>
            </div>
          </div>
        </section>

        <section className="cv-section">
          <div className="cv-story-grid">
            {storyCards.map((story) => (
              <article key={story.title} className="cv-story-card">
                <img src={story.image} alt={story.alt} loading="lazy" />
                <div>
                  <h3>{story.title}</h3>
                  <p>{story.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="cv-footer">
        <div className="cv-footer__top">
          <div>
            <strong>CivicVoice</strong>
            <p>Calm, transparent issue reporting for citizens, departments, and social response teams.</p>
          </div>

          <div>
            <h4>Explore</h4>
            <button type="button" onClick={() => accessTarget('/impact')}>Impact dashboard</button>
            <button type="button" onClick={() => accessTarget('/community')}>Community feed</button>
            <button type="button" onClick={() => accessTarget('/ngos')}>NGO directory</button>
          </div>

          <div>
            <h4>Get started</h4>
            <button type="button" onClick={openLoginSelector}>Sign in</button>
            <button type="button" onClick={openLoginSelector}>Login</button>
            <button type="button" onClick={() => accessTarget('/report?type=civic')}>Civic issue</button>
            <button type="button" onClick={() => accessTarget('/report?type=social')}>Social issue</button>
          </div>

          <div>
            <h4>Support</h4>
            <p>Childline 1098</p>
            <p>Women helpline 181</p>
            <p>Mental health 9152987821</p>
            <p>Elder support 14567</p>
          </div>
        </div>

        <div className="cv-footer__bottom">
          <p>© 2026 CivicVoice. Built for people-first civic and social response.</p>
          <p>Public resolution, safer follow-up, and better accountability in one flow.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
