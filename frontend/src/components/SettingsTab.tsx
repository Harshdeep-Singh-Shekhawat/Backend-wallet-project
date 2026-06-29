import React, { useState, useEffect } from 'react';
import { Loader2, Shield, User as UserIcon, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '@/lib/api';
import styles from '../app/page.module.css';

interface SettingsTabProps {
  user?: { id: string; name: string; email: string };
  onUpdateUser: () => void;
  currency: string;
  onCurrencyChange: (c: string) => void;
}

export default function SettingsTab({ user, onUpdateUser, currency, onCurrencyChange }: SettingsTabProps) {
  const [activeCategory, setActiveCategory] = useState('General');
  
  // General State
  const [name, setName] = useState(user?.name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Load current theme from localStorage or document
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    setTheme(currentTheme);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name cannot be empty');
    
    setIsUpdatingProfile(true);
    try {
      const res = await apiFetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Profile updated successfully');
      onUpdateUser();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    
    setIsUpdatingPassword(true);
    try {
      const res = await apiFetch('/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className={styles.sectionSpace}>
      <div className={`glass-panel ${styles.card}`}>
        <div className={styles.settingsGrid}>
          <div className={styles.settingsSidebar}>
            <div className={styles.settingsMenu}>
              <button 
                onClick={() => setActiveCategory('General')}
                className={`${styles.settingsMenuBtn} ${activeCategory === 'General' ? styles.settingsMenuBtnActive : ''}`}
              >
                <UserIcon size={16} style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'text-bottom' }} />
                General
              </button>
              <button 
                onClick={() => setActiveCategory('Security')}
                className={`${styles.settingsMenuBtn} ${activeCategory === 'Security' ? styles.settingsMenuBtnActive : ''}`}
              >
                <Shield size={16} style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'text-bottom' }} />
                Security
              </button>
              <button 
                onClick={() => setActiveCategory('Preferences')}
                className={`${styles.settingsMenuBtn} ${activeCategory === 'Preferences' ? styles.settingsMenuBtnActive : ''}`}
              >
                <Palette size={16} style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'text-bottom' }} />
                Preferences
              </button>
            </div>
          </div>

          <div className={styles.settingsContent}>
            {activeCategory === 'General' && (
              <div className={styles.settingsGroup}>
                <h3 className={styles.cardTitleBig}>General Settings</h3>
                <p className={styles.cardDesc} style={{ marginBottom: 0 }}>Update your basic profile information here.</p>
                
                <form onSubmit={handleUpdateProfile} className={styles.formBox} style={{ maxWidth: '100%', margin: 0 }}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Display Name</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className={styles.input} 
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Email Address</label>
                    <input 
                      type="email" 
                      value={user?.email || ''} 
                      className={styles.input} 
                      disabled 
                    />
                    <small style={{ color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>Email cannot be changed.</small>
                  </div>
                  <div className={styles.formButtons}>
                    <button type="submit" className={styles.btnSubmit} disabled={isUpdatingProfile} style={{ flex: 'none', padding: '12px 24px' }}>
                      {isUpdatingProfile && <Loader2 className={styles.loader} size={16} style={{ marginRight: '8px' }} />}
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeCategory === 'Security' && (
              <div className={styles.settingsGroup}>
                <h3 className={styles.cardTitleBig}>Security</h3>
                <p className={styles.cardDesc} style={{ marginBottom: 0 }}>Manage your password and account security.</p>
                
                <form onSubmit={handleUpdatePassword} className={styles.formBox} style={{ maxWidth: '100%', margin: 0 }}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Current Password</label>
                    <input 
                      type="password" 
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)} 
                      className={styles.input} 
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>New Password</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      className={styles.input} 
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      className={styles.input} 
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className={styles.formButtons}>
                    <button type="submit" className={styles.btnSubmit} disabled={isUpdatingPassword} style={{ flex: 'none', padding: '12px 24px' }}>
                      {isUpdatingPassword && <Loader2 className={styles.loader} size={16} style={{ marginRight: '8px' }} />}
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeCategory === 'Preferences' && (
              <div className={styles.settingsGroup}>
                <h3 className={styles.cardTitleBig}>Preferences</h3>
                <p className={styles.cardDesc} style={{ marginBottom: 0 }}>Customize how the application looks and feels.</p>
                
                <div className={styles.formBox} style={{ maxWidth: '100%', margin: 0 }}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Appearance</label>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                      <button 
                        onClick={() => handleThemeChange('dark')}
                        className={styles.btnSecondary}
                        style={{ borderColor: theme === 'dark' ? 'var(--color-accent)' : '', backgroundColor: theme === 'dark' ? 'var(--color-surface-active)' : '' }}
                      >
                        Dark Mode
                      </button>
                      <button 
                        onClick={() => handleThemeChange('light')}
                        className={styles.btnSecondary}
                        style={{ borderColor: theme === 'light' ? 'var(--color-accent)' : '', backgroundColor: theme === 'light' ? 'var(--color-surface-active)' : '' }}
                      >
                        Light Mode
                      </button>
                    </div>
                  </div>

                  <div className={styles.inputGroup} style={{ marginTop: '24px' }}>
                    <label className={styles.inputLabel}>Display Currency</label>
                    <select 
                      className={styles.input}
                      value={currency}
                      onChange={(e) => onCurrencyChange(e.target.value)}
                      style={{ marginTop: '8px', cursor: 'pointer' }}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
