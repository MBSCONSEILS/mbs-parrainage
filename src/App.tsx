import { useState, useRef, useEffect } from "react";

const QRCode = ({ value, size = 180 }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const modules = 25, cell = size / modules;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, size, size);
    const hash = s => s.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
    const seed = Math.abs(hash(value));
    const pattern = Array.from({ length: modules }, (_, r) =>
      Array.from({ length: modules }, (_, c) => {
        if (r < 7 && c < 7) return r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        if (r < 7 && c >= modules - 7) return r === 0 || r === 6 || c === modules - 1 || c === modules - 7 || (r >= 2 && r <= 4 && c >= modules - 5 && c <= modules - 3);
        if (r >= modules - 7 && c < 7) return r === modules - 1 || r === modules - 7 || c === 0 || c === 6 || (r >= modules - 5 && r <= modules - 3 && c >= 2 && c <= 4);
        return ((seed * (r * modules + c + 1)) % 7) < 3;
      })
    );
    ctx.fillStyle = "#2c4a5a";
    pattern.forEach((row, r) => row.forEach((on, c) => { if (on) ctx.fillRect(c * cell, r * cell, cell - 0.5, cell - 0.5); }));
  }, [value, size]);
  return <canvas ref={canvasRef} width={size} height={size} style={{ borderRadius: 8 }} />;
};

const C = { primary: "#2c4a5a", accent: "#c8a96e", light: "#f5f7fa", border: "#e2e8f0", text: "#2d3748", muted: "#718096" };
const STATUT_COLOR = { "À contacter": "#3182ce", "En cours": "#d69e2e", "Converti": "#38a169", "Perdu": "#e53e3e" };
const STATUTS = ["À contacter", "En cours", "Converti", "Perdu"];
const STORAGE_KEY = "mbs-prospects";

const Logo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
    <div style={{ width: 50, height: 50, borderRadius: 10, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ color: C.accent, fontWeight: 800, fontSize: 18, fontFamily: "Georgia, serif" }}>MBS</span>
    </div>
    <div>
      <div style={{ fontWeight: 800, fontSize: 16, color: C.primary, fontFamily: "Georgia, serif", letterSpacing: "0.08em" }}>CONSEILS</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Protection sociale & Gestion de patrimoine</div>
    </div>
  </div>
);

const Btn = ({ children, onClick, variant = "primary", style = {}, disabled = false }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: "10px 20px", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 500, fontSize: 14,
    background: variant === "primary" ? C.primary : variant === "accent" ? C.accent : "#fff",
    color: variant === "primary" || variant === "accent" ? "#fff" : C.primary,
    border: variant === "outline" ? `1.5px solid ${C.primary}` : "none",
    opacity: disabled ? 0.6 : 1, ...style
  }}>{children}</button>
);

const Inp = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 4 }}>{label}</label>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, color: C.text, boxSizing: "border-box", outline: "none" }} />
  </div>
);

const Toast = ({ notifs, onDismiss }) => (
  <div style={{ position: "fixed", bottom: 20, right: 20, display: "flex", flexDirection: "column", gap: 10, zIndex: 999 }}>
    {notifs.map(n => (
      <div key={n.id} style={{ background: C.primary, color: "#fff", borderRadius: 12, padding: "14px 18px", minWidth: 280, maxWidth: 340, boxShadow: "0 4px 24px rgba(0,0,0,0.18)", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 15 }}>👤</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Nouveau prospect</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}><strong>{n.prenom} {n.nom}</strong> — {n.parrain}</div>
          <div style={{ fontSize: 11, opacity: 0.65, marginTop: 2 }}>{n.besoin || "Besoin non précisé"} · {n.date}</div>
        </div>
        <button onClick={() => onDismiss(n.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
      </div>
    ))}
  </div>
);

const buildMailto = p => {
  const subject = encodeURIComponent(`[MBS Conseils] Fiche prospect — ${p.prenom} ${p.nom}`);
  const body = encodeURIComponent(`Bonjour,\n\nVoici la fiche du prospect recommandé via la plateforme MBS Conseils :\n\nNom : ${p.prenom} ${p.nom}\nEmail : ${p.email}\nTéléphone : ${p.tel || "Non renseigné"}\nBesoin : ${p.besoin || "Non précisé"}\nRecommandé par : ${p.parrain}\nDate : ${p.date}\nStatut : ${p.statut}\n\nCordialement,\nMBS Conseils`);
  return `mailto:?subject=${subject}&body=${body}`;
};

const DEFAULT_PROSPECTS = [
  { id: 1, prenom: "Sophie", nom: "Lefebvre", email: "sophie.l@email.fr", tel: "06 12 34 56 78", besoin: "Retraite", parrain: "Jean-Pierre Martin", date: "14/04/2026", statut: "À contacter" },
  { id: 2, prenom: "Marc", nom: "Dupont", email: "marc.d@email.fr", tel: "07 98 76 54 32", besoin: "Placement", parrain: "Catherine Moreau", date: "17/04/2026", statut: "En cours" },
];

export default function App() {
  const [view, setView] = useState("home");
  const [clientInput, setClientInput] = useState("");
  const [clientName, setClientName] = useState("");
  const [qrValue, setQrValue] = useState("");
  const [prospects, setProspects] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", tel: "", besoin: "" });
  const [submitted, setSubmitted] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [adminOk, setAdminOk] = useState(false);
  const [adminPwd, setAdminPwd] = useState("");
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const notifId = useRef(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setProspects(saved ? JSON.parse(saved) : DEFAULT_PROSPECTS);
    } catch {
      setProspects(DEFAULT_PROSPECTS);
    }
    setLoaded(true);
  }, []);

  const saveProspects = (list) => {
    setSaving(true);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
    setTimeout(() => setSaving(false), 800);
  };

  const addProspect = (p) => {
    const updated = [...prospects, p];
    setProspects(updated);
    saveProspects(updated);
  };

  const updateStatut = (id, s) => {
    const updated = prospects.map(x => x.id === id ? { ...x, statut: s } : x);
    setProspects(updated);
    setSelected(p => p ? { ...p, statut: s } : p);
    saveProspects(updated);
  };

  const pushNotif = (p) => {
    const id = ++notifId.current;
    setNotifs(n => [...n, { id, ...p }]);
    setTimeout(() => setNotifs(n => n.filter(x => x.id !== id)), 7000);
  };

  const handleClientLogin = () => {
    if (clientInput.trim()) { setClientName(clientInput.trim()); setQrValue(`mbs|${clientInput.trim()}|${Date.now()}`); setView("qr"); }
  };

  const handleProspectSubmit = () => {
    if (!form.prenom || !form.nom || !form.email) return;
    const parrain = clientName || "Lien direct";
    const newP = { id: Date.now(), ...form, parrain, date: new Date().toLocaleDateString("fr-FR"), statut: "À contacter" };
    addProspect(newP);
    setSubmitted(true);
    pushNotif(newP);
  };

  const Back = ({ to }) => (
    <button onClick={() => { setView(to); if (to === "home") { setAdminOk(false); setAdminPwd(""); setSelected(null); } }}
      style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 }}>← Retour</button>
  );

  if (!loaded) return <div style={{ padding: "3rem", textAlign: "center", color: C.muted }}>Chargement...</div>;

  return (
    <>
      <Toast notifs={notifs} onDismiss={id => setNotifs(n => n.filter(x => x.id !== id))} />
      {saving && <div style={{ position: "fixed", top: 12, right: 16, fontSize: 12, color: C.muted, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 12px", zIndex: 998 }}>Sauvegarde...</div>}

      {view === "home" && (
        <div style={{ maxWidth: 420, margin: "0 auto", padding: "2rem 1rem" }}>
          <Logo />
          <p style={{ fontSize: 14, color: C.muted, marginBottom: 28 }}>Choisissez votre espace.</p>
          {[
            { label: "Espace client", sub: "Générez votre QR code de parrainage", to: "client" },
            { label: "Formulaire prospect", sub: "Vous avez été recommandé — déposez vos coordonnées", to: "prospect" },
            { label: "Tableau de bord", sub: "Accès conseiller — suivre toutes les recommandations", to: "admin", badge: prospects.filter(p => p.statut === "À contacter").length },
          ].map(item => (
            <div key={item.to} onClick={() => setView(item.to)} style={{ marginBottom: 12, padding: "18px 20px", borderRadius: 12, border: `1.5px solid ${C.border}`, cursor: "pointer", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: C.primary, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: C.muted }}>{item.sub}</div>
              </div>
              {item.badge > 0 && <span style={{ background: "#e53e3e", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{item.badge}</span>}
            </div>
          ))}
        </div>
      )}

      {view === "client" && (
        <div style={{ maxWidth: 420, margin: "0 auto", padding: "2rem 1rem" }}>
          <Logo /><Back to="home" />
          <h2 style={{ fontSize: 18, fontWeight: 600, color: C.primary, marginBottom: 20 }}>Connexion client</h2>
          <Inp label="Votre nom complet" value={clientInput} onChange={setClientInput} placeholder="ex. Jean-Pierre Martin" />
          <Btn onClick={handleClientLogin} style={{ width: "100%" }}>Générer mon QR code</Btn>
        </div>
      )}

      {view === "qr" && (
        <div style={{ maxWidth: 420, margin: "0 auto", padding: "2rem 1rem", textAlign: "center" }}>
          <Logo />
          <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, padding: "28px 20px", marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Code de parrainage de</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.primary, marginBottom: 20 }}>{clientName}</div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <QRCode value={qrValue} size={180} />
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>Le conseiller recevra une notification dès que le prospect aura rempli sa fiche.</div>
          </div>
          <Btn onClick={() => { setView("home"); setClientInput(""); }} variant="outline" style={{ width: "100%" }}>Terminer</Btn>
        </div>
      )}

      {view === "prospect" && (
        <div style={{ maxWidth: 420, margin: "0 auto", padding: "2rem 1rem" }}>
          <Logo /><Back to="home" />
          {submitted ? (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f0fff4", border: "2px solid #38a169", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 26, color: "#38a169" }}>✓</div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: C.primary, marginBottom: 8 }}>Merci !</h2>
              <p style={{ fontSize: 14, color: C.muted }}>Votre fiche a bien été transmise. Notre conseiller vous contactera très prochainement.</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: C.primary, marginBottom: 4 }}>Formulaire prospect</h2>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Vous avez été recommandé par un client MBS Conseils.</p>
              <Inp label="Prénom *" value={form.prenom} onChange={v => setForm(f => ({ ...f, prenom: v }))} placeholder="Votre prénom" />
              <Inp label="Nom *" value={form.nom} onChange={v => setForm(f => ({ ...f, nom: v }))} placeholder="Votre nom" />
              <Inp label="Email *" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="votre@email.fr" type="email" />
              <Inp label="Téléphone" value={form.tel} onChange={v => setForm(f => ({ ...f, tel: v }))} placeholder="06 XX XX XX XX" />
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 4 }}>Besoin principal</label>
                <select value={form.besoin} onChange={e => setForm(f => ({ ...f, besoin: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, color: C.text, boxSizing: "border-box" }}>
                  <option value="">Sélectionner...</option>
                  <option>Retraite</option><option>Placement</option><option>Protection</option><option>Immobilier</option><option>Autre</option>
                </select>
              </div>
              <Btn onClick={handleProspectSubmit} style={{ width: "100%" }}>Envoyer ma fiche</Btn>
            </>
          )}
        </div>
      )}

      {view === "admin" && (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
          <Logo /><Back to="home" />
          {!adminOk ? (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: C.primary, marginBottom: 20 }}>Accès conseiller</h2>
              <Inp label="Mot de passe" value={adminPwd} onChange={setAdminPwd} placeholder="••••••••" type="password" />
              <Btn onClick={() => { if (adminPwd.length > 0) setAdminOk(true); }} style={{ width: "100%" }}>Se connecter</Btn>
            </>
          ) : selected ? (
            <>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 }}>← Retour à la liste</button>
              <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, padding: "24px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>{selected.prenom} {selected.nom}</div>
                    <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Reçu le {selected.date}</div>
                  </div>
                  <span style={{ background: `${STATUT_COLOR[selected.statut]}18`, color: STATUT_COLOR[selected.statut], padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{selected.statut}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  {[["Email", selected.email], ["Téléphone", selected.tel || "—"], ["Besoin", selected.besoin || "—"], ["Recommandé par", selected.parrain]].map(([k, v]) => (
                    <div key={k} style={{ background: C.light, borderRadius: 10, padding: "10px 14px" }}>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{k}</div>
                      <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 8 }}>Statut</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {STATUTS.map(s => (
                      <button key={s} onClick={() => updateStatut(selected.id, s)}
                        style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${s === selected.statut ? STATUT_COLOR[s] : C.border}`, background: s === selected.statut ? `${STATUT_COLOR[s]}15` : "#fff", color: s === selected.statut ? STATUT_COLOR[s] : C.muted, cursor: "pointer", fontSize: 13, fontWeight: s === selected.statut ? 600 : 400 }}>{s}</button>
                    ))}
                  </div>
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                  <a href={buildMailto(selected)} style={{ textDecoration: "none" }}>
                    <Btn variant="outline">✉ Partager par email</Btn>
                  </a>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: C.primary, margin: 0 }}>Tableau de bord</h2>
                <span style={{ background: C.light, color: C.primary, padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{prospects.length} prospects</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
                {STATUTS.map(s => (
                  <div key={s} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 4 }}>{s}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: STATUT_COLOR[s] }}>{prospects.filter(p => p.statut === s).length}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {prospects.length === 0 && <div style={{ textAlign: "center", padding: "2rem", color: C.muted, fontSize: 14 }}>Aucun prospect pour le moment.</div>}
                {prospects.map(p => (
                  <div key={p.id} onClick={() => setSelected(p)}
                    style={{ background: "#fff", borderRadius: 12, border: `1px solid ${C.border}`, padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: C.primary }}>{p.prenom} {p.nom}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Recommandé par <strong style={{ color: C.text }}>{p.parrain}</strong> · {p.date}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ background: `${STATUT_COLOR[p.statut]}18`, color: STATUT_COLOR[p.statut], padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{p.statut}</span>
                      <span style={{ color: C.muted, fontSize: 18 }}>›</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}