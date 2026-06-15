import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import styles from './AuthScreen.module.css';

interface AuthScreenProps {
  onSuccess: () => void;
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const body = isLogin ? { email, password } : { email, password, name };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.card}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className={styles.subtitle}>
            {isLogin ? 'Enter your details to access your portfolio.' : 'Sign up to start trading on NeoTrade.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          {!isLogin && (
            <div className={styles.inputGroup}>
              <label className={styles.label}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                placeholder="John Doe"
                required
              />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={loading} className={styles.btnSubmit}>
            {loading && <Loader2 size={16} className={styles.loader} />}
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className={styles.toggleArea}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
