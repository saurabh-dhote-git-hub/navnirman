import { useEffect, useMemo, useState } from "react";
import "./admin.css";

const API = "http://localhost:8080/api"; // Admin dashboard runs in the Windows browser, not the Android emulator.
const money = (paise) => `₹${(Number(paise || 0) / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const date = (v) => v ? new Date(v).toLocaleDateString("en-IN") : "—";

export default function AdminApp() {
  const [token, setToken] = useState(() => localStorage.getItem("navnirman_admin_token") || "");
  const [user, setUser] = useState(null);
  const [login, setLogin] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Overview");
  const [busy, setBusy] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState("");
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", description: "" });
  const [videoForm, setVideoForm] = useState({ titleMr: "", titleHi: "", titleEn: "", descriptionMr: "", descriptionHi: "", descriptionEn: "", categoryId: "", thumbnailUrl: "", premium: false, published: false, file: null });
  const [grantForm, setGrantForm] = useState({ customerEmail: "", planCode: "MONTHLY", durationDays: 30 });

  async function request(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API}${path}`, { ...options, headers });
    const body = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.detail || body?.message || `Request failed (${response.status})`);
    return body;
  }

  async function loadAll() {
    setBusy(true); setError("");
    try {
      const [d, a, v, c, u, s, p] = await Promise.all([
        request("/admin/dashboard"), request("/admin/analytics"), request("/admin/videos"),
        request("/admin/categories"), request("/admin/users"), request("/admin/subscriptions"),
        request("/subscriptions/plans")
      ]);
      setDashboard(d); setAnalytics(a); setVideos(v); setCategories(c); setUsers(u); setSubscriptions(s); setPlans(p);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    if (!token) return;
    request("/auth/me").then((u) => {
      if (u.role !== "ADMIN") throw new Error("This account does not have administrator access.");
      setUser(u); loadAll();
    }).catch((e) => { localStorage.removeItem("navnirman_admin_token"); setToken(""); setUser(null); setError(e.message); });
  }, [token]);

  async function signIn(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const r = await fetch(`${API}/auth/admin/login`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(login) });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.detail || data?.message || `Sign-in failed (${r.status})`);
      if (data.user?.role !== "ADMIN") throw new Error("This account is not an administrator.");
      localStorage.setItem("navnirman_admin_token", data.accessToken); setToken(data.accessToken); setUser(data.user);
    } catch (e2) { setError(e2.message); }
    finally { setBusy(false); }
  }

  function signOut() { localStorage.removeItem("navnirman_admin_token"); setToken(""); setUser(null); }

  async function createCategory(e) {
    e.preventDefault();
    try { await request("/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...categoryForm, active: true }) }); setModal(""); setCategoryForm({ name: "", slug: "", description: "" }); await loadAll(); }
    catch (e) { setError(e.message); }
  }

  async function toggleCategory(c) {
    try { await request(`/admin/categories/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: c.name, slug: c.slug, description: c.description, active: !c.active }) }); await loadAll(); }
    catch (e) { setError(e.message); }
  }

  async function removeCategory(c) {
    if (!confirm(`Delete category "${c.name}"? Categories used by videos cannot be deleted.`)) return;
    try { await request(`/admin/categories/${c.id}`, { method: "DELETE" }); await loadAll(); } catch (e) { setError(e.message); }
  }

  async function uploadVideo(e) {
    e.preventDefault();
    if (!videoForm.file) { setError("Choose a video file first."); return; }
    const fd = new FormData();
    Object.entries(videoForm).forEach(([k, v]) => { if (k !== "file" && v !== null && v !== "") fd.append(k, String(v)); });
    fd.append("file", videoForm.file);
    try { await request("/admin/videos", { method: "POST", body: fd }); setModal(""); setVideoForm({ titleMr: "", titleHi: "", titleEn: "", descriptionMr: "", descriptionHi: "", descriptionEn: "", categoryId: "", thumbnailUrl: "", premium: false, published: false, file: null }); await loadAll(); }
    catch (e) { setError(e.message); }
  }

  async function toggleVideo(v, field) {
    const payload = { titleMr: v.titleMr, titleHi: v.titleHi, titleEn: v.titleEn, descriptionMr: v.descriptionMr, descriptionHi: v.descriptionHi, descriptionEn: v.descriptionEn, categoryId: v.categoryId, thumbnailUrl: v.thumbnailUrl, premium: field === "premium" ? !v.premium : v.premium, published: field === "published" ? !v.published : v.published };
    try { await request(`/admin/videos/${v.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); await loadAll(); }
    catch (e) { setError(e.message); }
  }

  async function deleteVideo(v) {
    if (!confirm(`Delete "${v.titleEn}" and its stored video file? This cannot be undone.`)) return;
    try { await request(`/admin/videos/${v.id}`, { method: "DELETE" }); await loadAll(); } catch (e) { setError(e.message); }
  }

  async function grantSubscription(e) {
    e.preventDefault();
    try { await request("/admin/subscriptions/grant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...grantForm, durationDays: Number(grantForm.durationDays) }) }); setModal(""); await loadAll(); }
    catch (e) { setError(e.message); }
  }

  const filteredUsers = useMemo(() => users.filter(u => `${u.fullName} ${u.email} ${u.mobileNumber}`.toLowerCase().includes(query.toLowerCase())), [users, query]);
  const filteredVideos = useMemo(() => videos.filter(v => `${v.titleEn} ${v.titleMr} ${v.originalFilename}`.toLowerCase().includes(query.toLowerCase())), [videos, query]);

  if (!token || !user) return <div className="admin-login"><div className="login-brand"><span>N</span><div><b>NAVNIRMAN</b><small>ADMINISTRATION</small></div></div><form onSubmit={signIn}><p className="eyebrow">SECURE ADMIN ACCESS</p><h1>Welcome back.</h1><p className="muted">Sign in with your administrator account.</p><label>Email or mobile number<input required autoComplete="username" value={login.identifier} onChange={e => setLogin({ ...login, identifier: e.target.value })}/></label><label>Password<input required type="password" autoComplete="current-password" value={login.password} onChange={e => setLogin({ ...login, password: e.target.value })}/></label>{error && <div className="alert">{error}</div>}<button className="primary" disabled={busy}>{busy ? "Signing in…" : "Sign in to dashboard"}</button></form><small className="login-foot">Navnirman · Private administration</small></div>;

  const nav = ["Overview", "Videos", "Categories", "Users", "Subscriptions", "Analytics"];
  return <div className="admin-shell">
    <aside className="sidebar"><div className="login-brand"><span>N</span><div><b>NAVNIRMAN</b><small>ADMIN PANEL</small></div></div><div className="side-label">WORKSPACE</div>{nav.map(n => <button key={n} className={tab === n ? "nav active" : "nav"} onClick={() => { setTab(n); setQuery(""); }}>{n}</button>)}<div className="side-bottom"><div className="admin-identity"><b>{user.fullName}</b><small>{user.email}</small></div><button className="nav" onClick={signOut}>Sign out</button></div></aside>
    <main className="admin-main"><header className="admin-top"><div><small>WORKSPACE / {tab.toUpperCase()}</small><h1>{tab}</h1></div><div className="top-actions"><span className="admin-chip">ADMIN</span><button className="outline" onClick={loadAll}>{busy ? "Refreshing…" : "Refresh data"}</button></div></header>
      {error && <div className="alert global-alert">{error}<button onClick={() => setError("")}>Dismiss</button></div>}
      {tab === "Overview" && <><div className="stats-grid">{[["Videos",dashboard?.totalVideos],["Published",dashboard?.publishedVideos],["Customers",dashboard?.totalCustomers],["Categories",dashboard?.totalCategories],["Active subscriptions",analytics?.activeSubscriptions],["Paid revenue",money(analytics?.revenuePaise)]].map(([l,v]) => <div className="stat-card" key={l}><small>{l}</small><strong>{v ?? "—"}</strong></div>)}</div><section className="panel"><div className="panel-head"><div><small>CONTENT</small><h2>Recently added videos</h2></div><button className="outline" onClick={() => setTab("Videos")}>Manage videos</button></div><DataTable headers={["Title","Category","Visibility","Access"]} rows={videos.slice(0,6).map(v => [v.titleEn,v.categoryName,v.published?"Published":"Draft",v.premium?"Premium":"Free"])} /></section></>}
      {tab === "Videos" && <section className="panel"><div className="panel-head"><div><small>LIBRARY</small><h2>Video library</h2></div><div className="top-actions"><input className="search" placeholder="Search videos…" value={query} onChange={e=>setQuery(e.target.value)}/><button className="primary compact" onClick={()=>setModal("video")}>Upload video +</button></div></div><DataTable headers={["Video","Category","Type","Status","Actions"]} rows={filteredVideos.map(v => [<><b>{v.titleEn}</b><small className="subline">{v.originalFilename}</small></>,v.categoryName,v.premium?"Premium":"Free",v.published?"Published":"Draft",<div className="row-actions"><button onClick={()=>toggleVideo(v,"published")}>{v.published?"Unpublish":"Publish"}</button><button onClick={()=>toggleVideo(v,"premium")}>{v.premium?"Make free":"Make premium"}</button><button className="danger-text" onClick={()=>deleteVideo(v)}>Delete</button></div>])}/></section>}
      {tab === "Categories" && <section className="panel"><div className="panel-head"><div><small>CONTENT ORGANIZATION</small><h2>Categories</h2></div><button className="primary compact" onClick={()=>setModal("category")}>Add category +</button></div><DataTable headers={["Name","Slug","Description","Status","Actions"]} rows={categories.map(c=>[c.name,c.slug,c.description||"—",c.active?"Active":"Inactive",<div className="row-actions"><button onClick={()=>toggleCategory(c)}>{c.active?"Deactivate":"Activate"}</button><button className="danger-text" onClick={()=>removeCategory(c)}>Delete</button></div>])}/></section>}
      {tab === "Users" && <section className="panel"><div className="panel-head"><div><small>ACCOUNTS</small><h2>Customers</h2></div><input className="search" placeholder="Search customers…" value={query} onChange={e=>setQuery(e.target.value)}/></div><DataTable headers={["Customer","Mobile","Joined","Status"]} rows={filteredUsers.map(u=>[<><b>{u.fullName}</b><small className="subline">{u.email}</small></>,u.mobileNumber,date(u.createdAt),u.enabled?"Enabled":"Disabled"])}/></section>}
      {tab === "Subscriptions" && <section className="panel"><div className="panel-head"><div><small>MEMBERSHIP</small><h2>Subscriptions</h2></div><button className="primary compact" onClick={()=>setModal("grant")}>Grant subscription +</button></div><DataTable headers={["Customer","Plan","Status","Start","End","Access"]} rows={subscriptions.map(s=>[<><b>{s.fullName}</b><small className="subline">{s.email}</small></>,s.planName,s.status,date(s.startsAt),date(s.endsAt),s.active?"Active":"Inactive"])}/></section>}
      {tab === "Analytics" && <div className="stats-grid">{[["Customers",analytics?.totalCustomers],["Active subscriptions",analytics?.activeSubscriptions],["Successful payments",analytics?.paidOrders],["Failed payments",analytics?.failedOrders],["Paid revenue",money(analytics?.revenuePaise)]].map(([l,v])=><div className="stat-card" key={l}><small>{l}</small><strong>{v ?? "—"}</strong></div>)}</div>}
      <footer className="admin-footer">Navnirman Admin · Local PC environment · Data from your Spring Boot backend</footer>
    </main>
    {modal && <div className="modal-backdrop"><div className="modal"><div className="panel-head"><h2>{modal==="video"?"Upload video":modal==="category"?"Create category":"Grant subscription"}</h2><button className="close" onClick={()=>setModal("")}>×</button></div>
      {modal==="category" && <form onSubmit={createCategory}><label>Name<input required value={categoryForm.name} onChange={e=>setCategoryForm({...categoryForm,name:e.target.value,slug:categoryForm.slug||e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")})}/></label><label>Slug<input required value={categoryForm.slug} onChange={e=>setCategoryForm({...categoryForm,slug:e.target.value})}/></label><label>Description<textarea value={categoryForm.description} onChange={e=>setCategoryForm({...categoryForm,description:e.target.value})}/></label><button className="primary">Create category</button></form>}
      {modal==="video" && <form onSubmit={uploadVideo}><div className="form-grid"><label>Title (Marathi)<input required value={videoForm.titleMr} onChange={e=>setVideoForm({...videoForm,titleMr:e.target.value})}/></label><label>Title (Hindi)<input required value={videoForm.titleHi} onChange={e=>setVideoForm({...videoForm,titleHi:e.target.value})}/></label><label>Title (English)<input required value={videoForm.titleEn} onChange={e=>setVideoForm({...videoForm,titleEn:e.target.value})}/></label><label>Category<select required value={videoForm.categoryId} onChange={e=>setVideoForm({...videoForm,categoryId:e.target.value})}><option value="">Select category</option>{categories.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label>Thumbnail URL<input value={videoForm.thumbnailUrl} onChange={e=>setVideoForm({...videoForm,thumbnailUrl:e.target.value})}/></label><label>Video file<input required type="file" accept="video/*" onChange={e=>setVideoForm({...videoForm,file:e.target.files?.[0]||null})}/></label></div><div className="checks"><label><input type="checkbox" checked={videoForm.premium} onChange={e=>setVideoForm({...videoForm,premium:e.target.checked})}/> Premium</label><label><input type="checkbox" checked={videoForm.published} onChange={e=>setVideoForm({...videoForm,published:e.target.checked})}/> Publish immediately</label></div><button className="primary">Upload video</button></form>}
      {modal==="grant" && <form onSubmit={grantSubscription}><label>Customer email<input required type="email" value={grantForm.customerEmail} onChange={e=>setGrantForm({...grantForm,customerEmail:e.target.value})}/></label><label>Plan<select value={grantForm.planCode} onChange={e=>setGrantForm({...grantForm,planCode:e.target.value})}>{plans.map(p=><option key={p.code} value={p.code}>{p.name}</option>)}</select></label><label>Duration in days<input type="number" min="1" max="3660" value={grantForm.durationDays} onChange={e=>setGrantForm({...grantForm,durationDays:e.target.value})}/></label><button className="primary">Grant access</button></form>}
    </div></div>}
  </div>;
}

function DataTable({ headers, rows }) {
  return <div className="table-wrap"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.length ? rows.map((r,i)=><tr key={i}>{r.map((cell,j)=><td key={j}>{cell}</td>)}</tr>) : <tr><td colSpan={headers.length} className="empty">No records found.</td></tr>}</tbody></table></div>;
}
