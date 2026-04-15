import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { login } from './authSlice';
import { validateLoginCredentials } from './formValidation';
import { Eye, EyeOff, Shield, Mail, Lock } from 'lucide-react';
import '@/styles/LoginPage.css';

const AdminLoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const requestedPath = typeof location.state?.from === 'string' ? location.state.from : null;
  const safeAdminPath = requestedPath && requestedPath.startsWith('/admin') ? requestedPath : '/admin';

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const validationError = validateLoginCredentials({ email, password });
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const result = await dispatch(
      login({ email, password, expectedRole: 'admin' })
    ).unwrap().catch(() => null);
    if (result) navigate(safeAdminPath, { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass scale-in">
        <div className="auth-card-header slide-in-left stagger-1">
          <div className="auth-icon admin">
            <Shield size={24} />
          </div>
          <h2>Admin Console</h2>
          <p>Review and route citizen complaints with a visual status overview.</p>
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
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@civicvoice.local"
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {formError ? <p className="auth-error">{formError}</p> : null}
          {!formError && error ? <p className="auth-error">{error}</p> : null}
          <button
            type="submit"
            className="primary-btn w-full"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Signing in...' : 'Login as admin'}
          </button>
        </form>

        <div className="auth-hint fade-in stagger-3">
          <p>
            Demo account: <code>admin@civicvoice.local</code> /{' '}
            <code>Admin@123</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
