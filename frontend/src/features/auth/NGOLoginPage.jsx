import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, HeartHandshake, Lock, Mail } from 'lucide-react';
import { login } from './authSlice';
import { validateLoginCredentials } from './formValidation';
import '@/styles/LoginPage.css';

const NGOLoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const requestedPath = typeof location.state?.from === 'string' ? location.state.from : null;

  const onSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const validationError = validateLoginCredentials({ email, password });
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const result = await dispatch(login({ email, password, expectedRole: 'ngo' }))
      .unwrap()
      .catch(() => null);

    if (result) {
      navigate(requestedPath || '/ngo', { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass scale-in">
        <div className="auth-card-header slide-in-left stagger-1">
          <div className="auth-icon admin">
            <HeartHandshake size={24} />
          </div>
          <h2>NGO Portal</h2>
          <p>Manage social cases, update beneficiaries, and escalate to government when needed.</p>
        </div>

        <form className="auth-form slide-in-right stagger-2" onSubmit={onSubmit}>
          <div className="form-group">
            <label>
              <Mail size={14} />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ngo@civicvoice.local"
              required
            />
          </div>

          <div className="form-group">
            <label>
              <Lock size={14} />
              Password
            </label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
              />
              <button type="button" className="eye-btn" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {formError ? <p className="auth-error">{formError}</p> : null}
          {!formError && error ? <p className="auth-error">{error}</p> : null}

          <button type="submit" className="primary-btn w-full" disabled={status === 'loading'}>
            {status === 'loading' ? 'Signing in...' : 'Login as NGO'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NGOLoginPage;
