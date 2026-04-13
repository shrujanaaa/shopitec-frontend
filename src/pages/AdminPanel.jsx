import React, { useEffect, useState } from 'react';
import axios from 'axios';
const API = axios.create({ baseURL: 'https://YOUR-VERCEL-URL.vercel.app/api' });

const statusStyle = s => ({
  success: { background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0' },
  failed:  { background:'#fff5f5', color:'#dc2626', border:'1px solid #fecaca' },
  pending: { background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe' }
}[s] || {});

const pill = { padding:'3px 10px', borderRadius:'999px', fontSize:'11px', fontWeight:'500' };

export default function AdminPanel() {
  const [txns,     setTxns]     = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter,   setFilter]   = useState('all');
  const [search,   setSearch]   = useState('');
  const [pass,     setPass]     = useState('');
  const [authed,   setAuthed]   = useState(false);
  const [passErr,  setPassErr]  = useState('');

  const login = () => {
    if (pass === 'admin123') { setAuthed(true); setPassErr(''); }
    else setPassErr('Wrong password. Try: admin123');
  };

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    Promise.all([
      API.get('/admin/transactions'),
      API.get('/admin/stats')
    ]).then(([t, s]) => {
      setTxns(t.data.transactions || []);
      setStats(s.data);
    }).catch(err => {
      console.error('Admin fetch error:', err.message);
    }).finally(() => setLoading(false));
  }, [authed]);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      API.get('/admin/transactions'),
      API.get('/admin/stats')
    ]).then(([t, s]) => {
      setTxns(t.data.transactions || []);
      setStats(s.data);
    }).finally(() => setLoading(false));
  };

  const filtered = txns.filter(t => {
    const matchStatus = filter === 'all' || t.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      t.txn_id?.toLowerCase().includes(q) ||
      t.customer_name?.toLowerCase().includes(q) ||
      t.customer_email?.toLowerCase().includes(q) ||
      t.product_name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const tabSt = active => ({
    padding:'8px 18px', fontSize:'13px', border:'none', background:'none', cursor:'pointer',
    borderBottom: active ? '2px solid #5340c8' : '2px solid transparent',
    color: active ? '#5340c8' : '#888', fontWeight: active ? '500' : '400'
  });

  // ── PASSWORD GATE ─────────────────────────────────────────────────────────────
  if (!authed) return (
    <div style={{ minHeight:'100vh', background:'#f3f0ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:'16px', padding:'36px', width:'340px', border:'1px solid #e0d9ff', textAlign:'center' }}>
        <div style={{ fontSize:'24px', fontWeight:'500', color:'#5340c8', marginBottom:'4px' }}>Admin Panel</div>
        <div style={{ fontSize:'13px', color:'#888', marginBottom:'24px' }}>SpinShop — Transaction Monitor</div>
        <input
          type="password"
          value={pass}
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          placeholder="Enter admin password"
          style={{ width:'100%', padding:'10px 12px', border:'1px solid #ddd', borderRadius:'8px',
            fontSize:'14px', outline:'none', marginBottom:'10px', boxSizing:'border-box' }}
        />
        {passErr && <div style={{ fontSize:'12px', color:'#dc2626', marginBottom:'8px' }}>{passErr}</div>}
        <button onClick={login}
          style={{ width:'100%', padding:'11px', background:'#5340c8', color:'#fff', border:'none',
            borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer' }}>
          Enter
        </button>
        
        <a href="/" style={{ display:'block', marginTop:'12px', fontSize:'12px', color:'#7f77dd', textDecoration:'none' }}>← Back to app</a>
      </div>
    </div>
  );

  // ── MAIN ADMIN PANEL ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f5' }}>

      {/* Top bar */}
      <div style={{ background:'#5340c8', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ color:'#fff', fontWeight:'500', fontSize:'17px' }}>SpinShop Admin</div>
        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
          <button onClick={refresh}
            style={{ background:'rgba(255,255,255,0.2)', color:'#fff', border:'none', borderRadius:'8px',
              padding:'6px 14px', fontSize:'12px', cursor:'pointer' }}>
            Refresh
          </button>
          <a href="/" style={{ color:'rgba(255,255,255,0.75)', fontSize:'12px', textDecoration:'none' }}>← Back to app</a>
        </div>
      </div>

      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'24px 16px' }}>

        {/* Stats */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'24px' }}>
            {[
              { label:'Total transactions', value: stats.totalTxns,    color:'#1a1a1a' },
              { label:'Successful',         value: stats.successTxns,  color:'#16a34a' },
              { label:'Failed',             value: stats.failedTxns,   color:'#dc2626' },
              { label:'Total revenue',      value:`₹ ${Number(stats.totalRevenue).toLocaleString('en-IN')}`, color:'#5340c8' },
            ].map(c => (
              <div key={c.label} style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:'10px', padding:'16px' }}>
                <div style={{ fontSize:'11px', color:'#999', marginBottom:'6px' }}>{c.label}</div>
                <div style={{ fontSize:'22px', fontWeight:'500', color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:'12px', overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'0 16px', borderBottom:'1px solid #f0f0f0', flexWrap:'wrap', gap:'8px' }}>
            <div style={{ display:'flex' }}>
              <button style={tabSt(true)}>All transactions ({filtered.length})</button>
            </div>
            <div style={{ display:'flex', gap:'8px', padding:'8px 0', flexWrap:'wrap' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, email, product..."
                style={{ padding:'6px 12px', border:'1px solid #ddd', borderRadius:'8px',
                  fontSize:'12px', outline:'none', width:'220px' }}
              />
              {['all','success','failed'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding:'5px 12px', borderRadius:'999px', fontSize:'11px', border:'1px solid',
                    cursor:'pointer', borderColor: filter===f ? '#5340c8' : '#e0e0e0',
                    background: filter===f ? '#5340c8' : '#fff', color: filter===f ? '#fff' : '#666' }}>
                  {f.charAt(0).toUpperCase()+f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign:'center', padding:'48px', color:'#bbb' }}>Loading transactions...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px', color:'#bbb' }}>
              {txns.length === 0 ? 'No transactions yet. Make a purchase first!' : 'No transactions match your search.'}
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                <thead>
                  <tr style={{ background:'#fafafa' }}>
                    {['TXN ID','Product','Customer','Card masked','Amount','CVV','PIN','Status','Error','Date'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'10px 14px', color:'#888',
                        fontWeight:'500', borderBottom:'1px solid #f0f0f0', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t._id} onClick={() => setSelected(t)} style={{ borderBottom:'1px solid #f8f8f8', cursor:'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background='#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'10px 14px', fontFamily:'monospace', color:'#5340c8', whiteSpace:'nowrap' }}>{t.txn_id}</td>
                      <td style={{ padding:'10px 14px', whiteSpace:'nowrap' }}>{t.product_name || '—'}</td>
                      <td style={{ padding:'10px 14px' }}>
                        <div style={{ fontWeight:'500', whiteSpace:'nowrap' }}>{t.customer_name || '—'}</div>
                        <div style={{ color:'#999', fontSize:'11px' }}>{t.customer_email || '—'}</div>
                      </td>
                      <td style={{ padding:'10px 14px', fontFamily:'monospace', fontSize:'11px', color:'#555', whiteSpace:'nowrap' }}>{t.card_masked || '—'}</td>
                      <td style={{ padding:'10px 14px', fontWeight:'500', whiteSpace:'nowrap' }}>₹ {t.amount?.toLocaleString('en-IN')}</td>
                      <td style={{ padding:'10px 14px', fontFamily:'monospace', color:'#888' }}>{t.card_cvv_masked || '—'}</td>
                      <td style={{ padding:'10px 14px', fontFamily:'monospace', color:'#888' }}>{t.card_pin_masked || '—'}</td>
                      <td style={{ padding:'10px 14px' }}><span style={{ ...pill, ...statusStyle(t.status) }}>{t.status}</span></td>
                      <td style={{ padding:'10px 14px', fontFamily:'monospace', color:'#dc2626', whiteSpace:'nowrap' }}>{t.error_code || '—'}</td>
                      <td style={{ padding:'10px 14px', color:'#999', whiteSpace:'nowrap' }}>{new Date(t.createdAt).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex',
          alignItems:'center', justifyContent:'center', zIndex:100 }}
          onClick={() => setSelected(null)}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'28px', width:'440px',
            maxHeight:'85vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px' }}>
              <h3 style={{ fontSize:'16px', fontWeight:'600' }}>Transaction detail</h3>
              <button onClick={() => setSelected(null)}
                style={{ background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#999' }}>×</button>
            </div>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:'18px' }}>
              <span style={{ ...pill, ...statusStyle(selected.status), fontSize:'13px', padding:'5px 18px' }}>
                {selected.status.toUpperCase()}
              </span>
            </div>
            {[
              ['Transaction ID',   selected.txn_id,           true],
              ['Product',          selected.product_name      || '—'],
              ['Amount',           `₹ ${selected.amount?.toLocaleString('en-IN')} ${selected.currency}`],
              ['Method',           selected.method],
              ['Card number',      selected.card_masked        || '—'],
              ['Card holder',      selected.card_holder        || '—'],
              ['Expiry',           selected.card_expiry        || '—'],
              ['CVV',              selected.card_cvv_masked    || '—'],
              ['Card PIN',         selected.card_pin_masked    || '—'],
              ['Customer name',    selected.customer_name      || '—'],
              ['Email',            selected.customer_email     || '—'],
              ['Reference no',     selected.reference_number  || '—'],
              ['Bank response',    selected.bank_response      || '—'],
              ['Error code',       selected.error_code         || '—'],
              ['Error message',    selected.error_message      || '—'],
              ['Timestamp',        new Date(selected.createdAt).toLocaleString('en-IN')],
            ].map(([k, v, mono]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0',
                borderBottom:'1px solid #f5f5f5', fontSize:'13px', gap:'16px' }}>
                <span style={{ color:'#888', flexShrink:0 }}>{k}</span>
                <span style={{ fontWeight:'500', fontFamily: mono ? 'monospace' : 'inherit',
                  color: k.includes('Error') ? '#dc2626' : '#1a1a1a',
                  textAlign:'right', wordBreak:'break-all' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
