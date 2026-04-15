import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Shield, Users } from 'lucide-react';
import '@/styles/LoginPage.css';

const loginOptions = [
  {
    role: 'citizen',
    title: 'Citizen login',
    description: 'Report, track, and return to the page you were trying to open.',
    icon: <Users size={24} />,
    path: '/login/citizen',
  },
  {
    role: 'department',
    title: 'Department login',
    description: 'Handle civic updates, queues, and public follow-up.',
    icon: <Building2 size={24} />,
    path: '/login/department',
  },
  {
    role: 'admin',
    title: 'Admin login',
    description: 'Oversee routing, visibility, and platform operations.',
    icon: <Shield size={24} />,
    path: '/login/admin',
  },
];

const LoginSelectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const requestedPath = typeof location.state?.from === 'string' ? location.state.from : null;

  const openLogin = (path) => {
    navigate(path, { state: requestedPath ? { from: requestedPath } : undefined });
  };

  return (
    <div className="auth-page auth-page--selector">
      <div className="login-choice-card glass scale-in">
        <div className="auth-card-header login-choice-header">
          <div className="auth-icon citizen">
            <Shield size={24} />
          </div>
          <h2>Choose your access type</h2>
          <p>
            Pick the role that matches your task. If you came from another page, we will send you back after sign in.
          </p>
          {requestedPath ? <span className="login-return-chip">Returning to: {requestedPath}</span> : null}
        </div>

        <div className="login-options-grid">
          {loginOptions.map((option) => (
            <button key={option.role} type="button" className="login-option-card" onClick={() => openLogin(option.path)}>
              <div className="login-option-card__icon">{option.icon}</div>
              <div>
                <strong>{option.title}</strong>
                <p>{option.description}</p>
              </div>
              <ArrowRight size={18} />
            </button>
          ))}
        </div>

        <div className="auth-hint login-choice-hint">
          <p>Citizen, department, and admin access all start here.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginSelectionPage;