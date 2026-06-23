import React, { useState } from 'react';
import useSWR from 'swr';
import { Loader2, Plus, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch, apiFetcher } from '@/lib/api';
import styles from '../app/page.module.css';

export default function AdminAnnouncements() {
  const { data, mutate, isLoading } = useSWR('/api/admin/announcements', apiFetcher);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('GENERAL');
  const [status, setStatus] = useState('DRAFT');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return toast.error('Title and content required');

    setIsUpdating(true);
    try {
      const res = await apiFetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, type, status }),
      });
      if (!res.ok) throw new Error('Failed to create announcement');
      toast.success('Announcement published!');
      setTitle('');
      setContent('');
      mutate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await apiFetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Announcement deleted');
      mutate();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (isLoading) return <div className={styles.loading}><Loader2 className={styles.loader} /></div>;

  return (
    <div className={styles.sectionSpace}>
      <div className={`glass-panel ${styles.card}`}>
        <h3 className={styles.cardTitleBig}>Announcements</h3>
        <p className={styles.cardDesc}>Publish system-wide announcements and maintenance notices.</p>

        <form onSubmit={handleSubmit} className={styles.formBox} style={{ maxWidth: '100%', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
            <label className={styles.inputLabel}>Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className={styles.input} 
              placeholder="e.g. Scheduled Maintenance"
              required
            />
          </div>
          
          <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
            <label className={styles.inputLabel}>Content</label>
            <textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              className={styles.input} 
              placeholder="Announcement body..."
              style={{ minHeight: '80px', resize: 'vertical' }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div className={styles.inputGroup} style={{ flex: 1, marginBottom: 0 }}>
              <label className={styles.inputLabel}>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={styles.input}>
                <option value="GENERAL">General Notice</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="NEW_ASSET">New Asset Listing</option>
                <option value="PRODUCT_UPDATE">Product Update</option>
              </select>
            </div>
            
            <div className={styles.inputGroup} style={{ flex: 1, marginBottom: 0 }}>
              <label className={styles.inputLabel}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={styles.input}>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          <button type="submit" className={styles.btnSubmit} disabled={isUpdating} style={{ alignSelf: 'flex-start', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isUpdating ? <Loader2 className={styles.loader} size={18} /> : <Plus size={18} />}
            Create Announcement
          </button>
        </form>

        <h4 className={styles.sectionTitle} style={{ marginBottom: '16px' }}>Recent Announcements</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data?.announcements?.length === 0 && <div style={{ color: 'var(--color-text-secondary)' }}>No announcements yet.</div>}
          {data?.announcements?.map((ann: any) => (
            <div key={ann.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--color-accent)', color: 'var(--color-bg)' }}>{ann.type}</span>
                  <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: ann.status === 'PUBLISHED' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: ann.status === 'PUBLISHED' ? '#2ecc71' : '#aaa' }}>{ann.status}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '4px' }}>{ann.title}</div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{ann.content}</div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginTop: '8px' }}>Created: {new Date(ann.createdAt).toLocaleString()}</div>
              </div>
              <button onClick={() => handleDelete(ann.id)} className={styles.btnDanger} style={{ padding: '8px' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
