import { useEffect, useMemo, useState } from "react";
import { api, getStreamUrl, setAccessToken } from "./services/api";
import { saveToken, readToken, clearToken } from "./services/authStorage";
import "./App.css";

const fallbackImages = [
  "https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=85",
];

function mapVideo(item, index) {
  const title = item.titleEn || item.titleMr || item.titleHi || `Video ${item.id}`;
  const description = item.descriptionEn || item.descriptionMr || item.descriptionHi || "";
  return {
    ...item,
    title,
    description,
    category: String(item.categoryId ?? ""),
    subtitle: item.categoryName || "Navnirman",
    image: item.thumbnailUrl || fallbackImages[index % fallbackImages.length],
    duration: item.duration || "Video",
    premium: Boolean(item.premium),
    streamUrl: item.streamUrl,
  };
}

function Icon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.8 8.2-2.5 5.1-5.1 2.5 2.5-5.1z" /></>,
    crown: <><path d="m2.5 7 5 4 4.5-7 4.5 7 5-4-2 12H4.5z" /><path d="M5 22h14" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
    play: <><path d="m9 6 10 6-10 6z" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  };
  return <svg {...common}>{paths[name] || paths.play}</svg>;
}

function Brand() {
  return <div className="brand-lockup" aria-label="Navnirman">
    <div className="brand-mark">N</div>
    <div><div className="brand-name">NAVNIRMAN</div><div className="brand-devanagari">Stories. Knowledge. Perspective.</div></div>
  </div>;
}

function VideoCard({ video, onSelect }) {
  return <button className="video-card" onClick={() => onSelect(video)} aria-label={`Open ${video.title}`}>
    <div className="video-art" style={{ backgroundImage: `linear-gradient(180deg, transparent 25%, rgba(5,8,15,.88) 100%), url("${video.image}")` }}>
      {video.premium && <span className="premium-tag"><Icon name="crown" size={12} /> PREMIUM</span>}
      <span className="duration">{video.duration}</span>
      <span className="card-play"><Icon name="play" size={19} /></span>
    </div>
    <div className="video-card-copy">
      <span className="card-kicker">{video.subtitle}</span>
      <strong>{video.title}</strong>
    </div>
  </button>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [categories, setCategories] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authUser, setAuthUser] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authForm, setAuthForm] = useState({ fullName: "", email: "", mobileNumber: "", identifier: "", password: "" });

  useEffect(() => {
    let mounted = true;
    async function restoreSession() {
      const token = await readToken();
      if (!token || !mounted) return;
      setAccessToken(token);
      try {
        const user = await api.me();
        if (mounted) setAuthUser(user);
      } catch {
        await clearToken();
        setAccessToken(null);
      }
    }
    restoreSession();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadContent() {
      setLoading(true);
      setApiError("");
      try {
        const [categoryData, videoData] = await Promise.all([
          api.getCategories(),
          api.getVideos(),
        ]);
        if (!mounted) return;
        setCategories(Array.isArray(categoryData) ? categoryData.filter((c) => c.active !== false) : []);
        setVideos(Array.isArray(videoData) ? videoData.filter((v) => v.published !== false).map(mapVideo) : []);
      } catch (error) {
        if (mounted) setApiError(error.message || "Unable to load content. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadContent();
    return () => { mounted = false; };
  }, []);

  const categoryOptions = [{ id: "all", label: "All" }, ...categories.map((c) => ({
    id: String(c.id),
    label: c.name,
  }))];

  const filteredVideos = useMemo(() => videos.filter((video) => {
    const categoryMatch = activeCategory === "all" || video.category === activeCategory;
    const searchMatch = !search || `${video.title} ${video.subtitle} ${video.description}`.toLowerCase().includes(search.toLowerCase());
    return categoryMatch && searchMatch;
  }), [videos, activeCategory, search]);

  const featured = videos[0] || null;
  const copy = { greeting: "A new perspective begins here", sub: "Discover stories across knowledge, history and culture.", explore: "Explore now", continue: "Featured for you", viewAll: "View all", categories: "Explore by topic", premium: "Navnirman Premium", premiumText: "Unlock thoughtful stories and deeper perspectives.", join: "Become a member", latest: "Recently added", search: "Search videos or topics..." };

  const selectTab = (tab) => {
    setActiveTab(tab);
    setNotice("");
    if (tab === "explore") setActiveCategory("all");
  };

  const categoryButtons = categoryOptions.map((category) => <button key={category.id} className={`category-chip ${activeCategory === category.id ? "selected" : ""}`} onClick={() => { setActiveCategory(category.id); if (activeTab === "home") setActiveTab("explore"); }}>
    <span>{category.label}</span>
  </button>);

  const contentStatus = loading
    ? <div className="empty-state">Loading Navnirman content…</div>
    : apiError
      ? <div className="empty-state">{apiError}<br /><button className="text-button" onClick={() => window.location.reload()}>Try again</button></div>
      : null;

  const updateAuthField = (field, value) => setAuthForm((current) => ({ ...current, [field]: value }));

  async function submitAuth(event) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    setAuthSuccess("");
    try {
      const result = authMode === "register"
        ? await api.register({
            fullName: authForm.fullName.trim(),
            email: authForm.email.trim(),
            mobileNumber: authForm.mobileNumber.trim(),
            password: authForm.password,
          })
        : await api.login({
            identifier: authForm.identifier.trim(),
            password: authForm.password,
          });
      await saveToken(result.accessToken);
      setAccessToken(result.accessToken);
      setAuthUser(result.user);
      setAuthForm({ fullName: "", email: "", mobileNumber: "", identifier: "", password: "" });
      setAuthSuccess(authMode === "register" ? "Your account has been created." : "You are now signed in.");
    } catch (error) {
      setAuthError(error.message || "Authentication failed. Please try again.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function logout() {
    await clearToken();
    setAccessToken(null);
    setAuthUser(null);
    setAuthSuccess("You have been signed out.");
  }

  return <div className="app-shell" data-theme="dark">
    <header className="topbar">
      <Brand />
      <div className="topbar-actions">
        <span className="language-indicator">ENGLISH</span>
        <button className="avatar-button" onClick={() => selectTab("profile")} aria-label="Profile"><Icon name="user" size={19} /></button>
      </div>
    </header>

    <main className="main-content">
      {activeTab === "home" && <>
        <section className="hero-panel">
          <div className="hero-image" />
          <div className="hero-shade" />
          <div className="hero-content">
            <div className="eyebrow"><span className="eyebrow-line" /> KNOWLEDGE · CULTURE · PERSPECTIVE</div>
            <p className="hero-devanagari">STORIES THAT INSPIRE</p>
            <h1>{copy.greeting}</h1>
            <p className="hero-subtitle">{copy.sub}</p>
            <button className="gold-button" onClick={() => selectTab("explore")}>{copy.explore}<Icon name="arrow" size={17} /></button>
          </div>
          <div className="hero-index"><span>01</span><i /> 04</div>
        </section>

        <section className="content-section">
          <div className="section-heading"><div><span className="section-overline">HANDPICKED STORIES</span><h2>{copy.continue}</h2></div><button className="text-button" onClick={() => selectTab("explore")}>{copy.viewAll}<Icon name="arrow" size={15} /></button></div>
          {contentStatus || (featured ? <div className="featured-row">
            <button className="featured-card" onClick={() => setSelectedVideo(featured)}>
              <div className="featured-art" style={{ backgroundImage: `linear-gradient(90deg,rgba(7,10,16,.85),rgba(7,10,16,.1)),url("${featured.image}")` }}>
                <span className="featured-label">FEATURED</span><span className="featured-play"><Icon name="play" size={21} /></span>
                <div className="featured-info"><span>{featured.subtitle}</span><strong>{featured.title}</strong><small>{featured.duration} <b>·</b> {featured.premium ? "Premium" : "Free to watch"}</small></div>
              </div>
            </button>
            <div className="featured-aside"><span className="aside-number">01 <i /> {String(videos.length).padStart(2, "0")}</span><h3>Inspired by history.<br/>Built for tomorrow.</h3><p>Stories that connect our roots with the world ahead.</p><button className="round-arrow" onClick={() => setSelectedVideo(featured)}><Icon name="arrow" /></button></div>
          </div> : <div className="empty-state">No published videos are available yet.</div>)}
        </section>

        <section className="content-section category-section">
          <div className="section-heading"><div><span className="section-overline">FIND YOUR INTEREST</span><h2>{copy.categories}</h2></div></div>
          <div className="category-chips">{categoryButtons}</div>
        </section>

        <section className="premium-banner">
          <div className="premium-emblem"><Icon name="crown" size={27} /></div>
          <div className="premium-copy"><span className="section-overline">GO BEYOND THE ORDINARY</span><h2>{copy.premium}</h2><p>{copy.premiumText}</p></div>
          <div className="premium-action"><strong>₹50 <small>/ 30 days</small></strong><button className="gold-button" onClick={() => selectTab("premium")}>{copy.join}<Icon name="arrow" size={16} /></button></div>
        </section>

        <section className="content-section latest-section">
          <div className="section-heading"><div><span className="section-overline">FRESH PERSPECTIVES</span><h2>{copy.latest}</h2></div><button className="text-button" onClick={() => selectTab("explore")}>{copy.viewAll}<Icon name="arrow" size={15} /></button></div>
          {contentStatus || <div className="video-grid">{videos.slice(1).map((video) => <VideoCard key={video.id} video={video} onSelect={setSelectedVideo} />)}</div>}
        </section>
      </>}

      {activeTab === "explore" && <section className="page-section">
        <span className="section-overline">DISCOVER SOMETHING NEW</span><h1 className="page-title">{copy.categories}</h1>
        <div className="search-box"><Icon name="search" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={copy.search} /></div>
        <div className="category-chips explore-chips">{categoryButtons}</div>
        {contentStatus || <div className="video-grid explore-grid">{filteredVideos.map((video) => <VideoCard key={video.id} video={video} onSelect={setSelectedVideo} />)}</div>}
        {!loading && !apiError && filteredVideos.length === 0 && <div className="empty-state">No videos found. Try another search or category.</div>}
      </section>}

      {activeTab === "premium" && <section className="page-section premium-page">
        <div className="premium-emblem large"><Icon name="crown" size={34} /></div><span className="section-overline">A DEEPER WAY TO DISCOVER</span><h1 className="page-title">{copy.premium}</h1><p className="premium-page-copy">{copy.premiumText}</p>
        <div className="membership-card"><span>MONTHLY MEMBERSHIP</span><strong>₹50</strong><small>30 days of access</small><ul><li>Premium video library</li><li>Stories and perspectives worth exploring</li><li>Access across supported devices</li></ul><button className="gold-button" onClick={() => setNotice("Subscription checkout will be connected after the backend integration phase.")}>Continue <Icon name="arrow" size={16} /></button></div>
        {notice && <p className="inline-notice">{notice}</p>}
      </section>}

      {activeTab === "profile" && <section className="page-section profile-page">
        {authUser ? <>
          <div className="profile-avatar"><Icon name="user" size={30} /></div>
          <span className="section-overline">YOUR NAVNIRMAN ACCOUNT</span>
          <h1 className="page-title">{authUser.fullName}</h1>
          <div className="account-details">
            <p>{authUser.email}</p><p>{authUser.mobileNumber}</p><span className="account-role">{authUser.role}</span>
          </div>
          <button className="gold-button" onClick={logout}>Sign out</button>
        </> : <>
          <div className="profile-avatar"><Icon name="user" size={30} /></div>
          <span className="section-overline">YOUR NAVNIRMAN</span>
          <h1 className="page-title">{authMode === "login" ? "Welcome back" : "Create account"}</h1>
          <p className="premium-page-copy">{authMode === "login" ? "Sign in to continue your journey." : "Join Navnirman to access your account and membership."}</p>
          <form className="auth-form" onSubmit={submitAuth}>
            {authMode === "register" && <>
              <label>Full name<input required minLength="2" maxLength="120" autoComplete="name" value={authForm.fullName} onChange={(e) => updateAuthField("fullName", e.target.value)} placeholder="Your full name" /></label>
              <label>Email address<input required type="email" maxLength="254" autoComplete="email" value={authForm.email} onChange={(e) => updateAuthField("email", e.target.value)} placeholder="you@example.com" /></label>
              <label>Mobile number<input required type="tel" inputMode="numeric" pattern="[0-9]{10,15}" value={authForm.mobileNumber} onChange={(e) => updateAuthField("mobileNumber", e.target.value)} placeholder="10–15 digits" /></label>
            </>}
            {authMode === "login" && <label>Email or mobile number<input required autoComplete="username" value={authForm.identifier} onChange={(e) => updateAuthField("identifier", e.target.value)} placeholder="Email or mobile number" /></label>}
            <label>Password<input required type="password" minLength="8" maxLength="72" autoComplete={authMode === "login" ? "current-password" : "new-password"} value={authForm.password} onChange={(e) => updateAuthField("password", e.target.value)} placeholder="At least 8 characters" /></label>
            {authError && <p className="auth-error" role="alert">{authError}</p>}
            {authSuccess && <p className="auth-success" role="status">{authSuccess}</p>}
            <button className="gold-button auth-submit" type="submit" disabled={authBusy}>{authBusy ? "Please wait…" : authMode === "login" ? "Sign in" : "Create account"} <Icon name="arrow" size={16} /></button>
          </form>
          <button className="auth-switch" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); setAuthSuccess(""); }}> {authMode === "login" ? "New to Navnirman? Create an account" : "Already have an account? Sign in"} </button>
        </>}
      </section>}
    </main>

    <nav className="bottom-nav" aria-label="Main navigation">
      {[["home","Home","home"],["explore","Explore","compass"],["premium","Premium","crown"],["profile","Profile","user"]].map(([tab,label,icon]) => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => selectTab(tab)}><Icon name={icon} size={20} /><span>{label}</span></button>)}
    </nav>

    {selectedVideo && <div className="modal-backdrop" role="presentation" onClick={() => { setSelectedVideo(null); setPlayerOpen(false); }}>
      <div className="video-modal" role="dialog" aria-modal="true" aria-label={selectedVideo.title} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => { setSelectedVideo(null); setPlayerOpen(false); }} aria-label="Close">×</button>
        {playerOpen && !selectedVideo.premium ? (
          <div className="player-wrap">
            <video
              className="navnirman-player"
              controls
              autoPlay
              playsInline
              preload="metadata"
			  muted={false}
			  volume={1}
              src={getStreamUrl(selectedVideo.streamUrl, selectedVideo.id)}
              onError={() => setNotice("The video could not be played. Check that the backend stream is available and the video file exists.")}
            />
            <div className="player-caption">
              <span className="section-overline">{selectedVideo.subtitle}</span>
              <h2>{selectedVideo.title}</h2>
              <p>{selectedVideo.description}</p>
              {notice && <p className="inline-notice">{notice}</p>}
            </div>
          </div>
        ) : (
          <div className="modal-art" style={{ backgroundImage: `linear-gradient(0deg,rgba(5,8,15,.97),rgba(5,8,15,.10)),url("${selectedVideo.image}")` }}>
            <span className="section-overline">{selectedVideo.subtitle}</span>
            <h2>{selectedVideo.title}</h2>
            <p>{selectedVideo.premium ? "Premium content" : "Free to watch"}</p>
            <p>{selectedVideo.description}</p>
            {selectedVideo.premium ? (
              <div className="play-restriction">
                <Icon name="lock" size={17} />
                <span>Sign in and an active Premium membership are required to watch this video.</span>
              </div>
            ) : (
              <button className="gold-button" onClick={() => { setNotice(""); setPlayerOpen(true); }}>
                <Icon name="play" size={17} /> Play video
              </button>
            )}
          </div>
        )}
      </div>
    </div>}
    <footer className="app-footer"><Brand /><span>Stories for a more thoughtful tomorrow.</span><small>© Navnirman</small></footer>
  </div>;
}
