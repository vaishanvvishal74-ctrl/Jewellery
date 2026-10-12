'use client';

import { FormEvent, useEffect, useState } from 'react';

type AdminUser = { id: string; email: string; name?: string | null; role: string };
type Product = { id: string; name: string; price: number; category: string; inStock: boolean; image: string };
type Order = { id: string; status: string; paymentStatus?: string; total?: number; createdAt?: string };

export default function AdminPage() {
  const [email, setEmail] = useState('admin@jewellery.com');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<AdminUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadDashboard() {
    const me = await fetch('/api/auth/me', { cache: 'no-store' });
    const meJson = await me.json();
    if (!me.ok || !meJson?.success || meJson?.data?.role !== 'ADMIN') {
      setUser(null);
      return;
    }
    setUser(meJson.data);
    const [productResponse, orderResponse] = await Promise.all([
      fetch('/api/products?limit=100', { cache: 'no-store' }),
      fetch('/api/admin/orders', { cache: 'no-store' }),
    ]);
    const productJson = await productResponse.json().catch(() => ({}));
    const orderJson = await orderResponse.json().catch(() => ({}));
    if (productResponse.ok && productJson?.success) setProducts(productJson.data || []);
    else setMessage(productJson?.error || 'Products load nahi hue. Database configuration check karein.');
    if (orderResponse.ok && orderJson?.success) setOrders(orderJson.data || []);
    else if (orderResponse.status === 403) setMessage('Admin login check nahi hua. Database aur admin account verify karein.');
  }

  useEffect(() => { void loadDashboard(); }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) throw new Error(result?.error || 'Login fail hua.');
      if (result?.data?.role !== 'ADMIN') throw new Error('Ye account admin nahi hai. Admin account se login karein.');
      setUser(result.data);
      setPassword('');
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login fail hua.');
    } finally { setBusy(false); }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    setUser(null); setProducts([]); setOrders([]); setMessage('Logout ho gaya.');
  }

  return (
    <main style={{ minHeight: '75vh', background: '#f8fafc', padding: '28px 16px', color: '#111827' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <header style={{ marginBottom: 24 }}>
          <p style={{ color: '#a21caf', fontWeight: 700, letterSpacing: 2, margin: 0 }}>JEWELLERY STORE</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '8px 0' }}>Admin Panel</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Products aur orders manage karne ka dashboard</p>
        </header>

        {message && <div role="status" style={{ padding: 12, borderRadius: 8, background: '#fff7ed', color: '#9a3412', marginBottom: 16 }}>{message}</div>}

        {!user ? (
          <form onSubmit={handleLogin} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 22, maxWidth: 440, boxShadow: '0 8px 24px #0f172a0a' }}>
            <h2 style={{ fontSize: 21, fontWeight: 700, marginTop: 0 }}>Admin Login</h2>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }} htmlFor="admin-email">Email</label>
            <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #cbd5e1', borderRadius: 8, marginBottom: 14, boxSizing: 'border-box' }} />
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }} htmlFor="admin-password">Password</label>
            <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #cbd5e1', borderRadius: 8, marginBottom: 18, boxSizing: 'border-box' }} />
            <button disabled={busy} type="submit" style={{ width: '100%', border: 0, borderRadius: 8, padding: 13, background: busy ? '#cbd5e1' : '#a21caf', color: 'white', fontWeight: 700 }}>{busy ? 'Login ho raha hai…' : 'Login'}</button>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 0 }}>Login ke liye Render mein set ADMIN_EMAIL aur ADMIN_PASSWORD use karein. Database URL sahi hona chahiye.</p>
          </form>
        ) : (
          <>
            <section style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 18 }}>
              <div><strong>Welcome, {user.name || user.email}</strong><p style={{ margin: '4px 0 0', color: '#64748b' }}>{user.email} · {user.role}</p></div>
              <button onClick={logout} style={{ border: '1px solid #cbd5e1', borderRadius: 8, background: 'white', padding: '9px 14px' }}>Logout</button>
            </section>
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 22 }}>
              {[['Products', String(products.length)], ['Orders', String(orders.length)], ['In stock', String(products.filter(p => p.inStock).length)]].map(([label, value]) => <div key={label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}><p style={{ margin: 0, color: '#64748b' }}>{label}</p><p style={{ fontSize: 30, fontWeight: 800, margin: '8px 0 0' }}>{value}</p></div>)}
            </section>
            <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, marginBottom: 18 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 0 }}>Products</h2>
              {products.length === 0 ? <p style={{ color: '#64748b' }}>Product list khaali hai ya database error hai.</p> : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}><thead><tr><th style={{ padding: 9, borderBottom: '1px solid #e2e8f0' }}>Name</th><th style={{ padding: 9, borderBottom: '1px solid #e2e8f0' }}>Price</th><th style={{ padding: 9, borderBottom: '1px solid #e2e8f0' }}>Category</th><th style={{ padding: 9, borderBottom: '1px solid #e2e8f0' }}>Stock</th></tr></thead><tbody>{products.map(p => <tr key={p.id}><td style={{ padding: 9, borderBottom: '1px solid #f1f5f9' }}>{p.name}</td><td style={{ padding: 9, borderBottom: '1px solid #f1f5f9' }}>₹{p.price}</td><td style={{ padding: 9, borderBottom: '1px solid #f1f5f9' }}>{p.category}</td><td style={{ padding: 9, borderBottom: '1px solid #f1f5f9' }}>{p.inStock ? 'In stock' : 'Out of stock'}</td></tr>)}</tbody></table></div>}
            </section>
            <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 0 }}>Recent Orders</h2>
              {orders.length === 0 ? <p style={{ color: '#64748b' }}>Orders abhi nahi hain ya order API/database check karna hoga.</p> : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}><thead><tr><th style={{ padding: 9, borderBottom: '1px solid #e2e8f0' }}>Order ID</th><th style={{ padding: 9, borderBottom: '1px solid #e2e8f0' }}>Status</th><th style={{ padding: 9, borderBottom: '1px solid #e2e8f0' }}>Payment</th></tr></thead><tbody>{orders.map(o => <tr key={o.id}><td style={{ padding: 9, borderBottom: '1px solid #f1f5f9' }}>{o.id.slice(0, 10)}</td><td style={{ padding: 9, borderBottom: '1px solid #f1f5f9' }}>{o.status}</td><td style={{ padding: 9, borderBottom: '1px solid #f1f5f9' }}>{o.paymentStatus || '—'}</td></tr>)}</tbody></table></div>}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
