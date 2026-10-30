import { useCallback, useEffect, useState, type FormEvent } from "react";
import { dashboardSummarySchema, publicUserSchema, type DashboardSummary, type Equipment, type Operator, type PublicUser, type Recipe, type RecipeStepInput, type Session, type SessionProgress, type SimulationAction } from "@heisenberg/contracts";
import { dashboardHasAvailableActivity, dashboardMetricDescription, dashboardMetricValue } from "./dashboard";
import { getProfileFields } from "./profile";
import { emptyRecipeStep, recipeFromPayload, recipesFromPayload } from "./recipes";
import { equipmentFromPayload, equipmentItemFromPayload } from "./equipment";
import { operatorsFromPayload, sessionAdvanceFromPayload, sessionFromPayload, sessionProgressFromPayload, sessionsFromPayload } from "./sessions";

type AuthMode = "login" | "register";
type ShellSection = "dashboard" | "profile" | "recipes" | "equipment" | "sessions";

const navigationItems: Array<{ id: ShellSection; label: string; hint: string }> = [
  { id: "dashboard", label: "Dashboard", hint: "Your workspace overview" },
  { id: "profile", label: "Profile", hint: "Account details" },
  { id: "recipes", label: "Recipes", hint: "Fictional recipe catalog" },
  { id: "equipment", label: "Equipment", hint: "Fictional equipment catalog" },
  { id: "sessions", label: "Sessions", hint: "Turn-based cooking sessions" },
];

type ApiError = {
  error?: {
    code?: string;
    message?: string;
  };
};

function errorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const error = (payload as ApiError).error;
    if (error?.message) {
      return error.message;
    }
  }

  return fallback;
}

async function readApiPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function validateCredentials(email: string, password: string): string | null {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return "Enter a valid email address.";
  }

  if (password.length < 12 || password.length > 128) {
    return "Password must be between 12 and 128 characters.";
  }

  return null;
}

function publicUserFromPayload(payload: unknown): PublicUser | null {
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    return null;
  }

  const parsed = publicUserSchema.safeParse(payload.data);
  return parsed.success ? parsed.data : null;
}

function dashboardSummaryFromPayload(payload: unknown): DashboardSummary | null {
  const parsed = dashboardSummarySchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}

function AuthForm({
  mode,
  onModeChange,
  onAuthenticated,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onAuthenticated: (user: PublicUser) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validateCredentials(email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const payload = await readApiPayload(response);
      const authenticatedUser = publicUserFromPayload(payload);

      if (!response.ok || !authenticatedUser) {
        throw new Error(errorMessage(payload, "Authentication failed."));
      }

      onAuthenticated(authenticatedUser);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <h1 id="auth-title">Heisenberg Logistics</h1>
        <p className="muted">{mode === "login" ? "Log in to continue." : "Create your account to begin."}</p>

        <form className="auth-form" onSubmit={submit} noValidate>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={12}
            maxLength={128}
            required
          />

          {error ? <p className="error-message" role="alert">{error}</p> : null}

          <button type="submit" disabled={submitting}>
            {submitting ? "Working..." : mode === "login" ? "Log in" : "Register"}
          </button>
        </form>

        <button
          className="link-button"
          type="button"
          onClick={() => {
            setError(null);
            onModeChange(mode === "login" ? "register" : "login");
          }}
        >
          {mode === "login" ? "Need an account? Register" : "Already have an account? Log in"}
        </button>
      </section>
    </main>
  );
}

function ApplicationShell({
  user,
  error,
  onLogout,
  onSessionExpired,
}: {
  user: PublicUser;
  error: string | null;
  onLogout: () => void;
  onSessionExpired: () => void;
}) {
  const [activeSection, setActiveSection] = useState<ShellSection>("dashboard");
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const activeItem = navigationItems.find((item) => item.id === activeSection) ?? navigationItems[0];

  function selectSection(section: ShellSection) {
    setActiveSection(section);
    setMobileNavigationOpen(false);
  }

  return (
    <div className="shell-layout">
      <button
        className={`sidebar-backdrop${mobileNavigationOpen ? " is-visible" : ""}`}
        type="button"
        aria-label="Close navigation"
        onClick={() => setMobileNavigationOpen(false)}
      />

      <aside className={`shell-sidebar${mobileNavigationOpen ? " is-open" : ""}`} aria-label="Primary navigation">
        <div className="shell-brand">
          <span className="brand-mark" aria-hidden="true">HL</span>
          <div>
            <strong>Heisenberg</strong>
            <span>Logistics</span>
          </div>
        </div>

        <nav className="shell-navigation" aria-label="Application areas">
          {navigationItems.map((item) => (
            <button
              className={`navigation-item${activeSection === item.id ? " is-active" : ""}`}
              type="button"
              key={item.id}
              aria-current={activeSection === item.id ? "page" : undefined}
              onClick={() => selectSection(item.id)}
            >
              <span className="navigation-icon" aria-hidden="true">{item.label.slice(0, 1)}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <p className="sidebar-note">V1 workspace</p>
      </aside>

      <div className="shell-main">
        <header className="shell-header">
          <button
            className="menu-toggle"
            type="button"
            aria-label="Open navigation"
            aria-expanded={mobileNavigationOpen}
            onClick={() => setMobileNavigationOpen(true)}
          >
            <span aria-hidden="true">☰</span>
          </button>
          <div className="header-title">
            <span className="header-kicker">Authenticated workspace</span>
            <strong>Heisenberg Logistics</strong>
          </div>

          <div className="user-menu">
            <button
              className="user-menu-trigger"
              type="button"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              onClick={() => setUserMenuOpen((open) => !open)}
            >
              <span className="user-avatar" aria-hidden="true">{user.email.slice(0, 1).toUpperCase()}</span>
              <span className="user-menu-label">{user.email}</span>
              <span aria-hidden="true">⌄</span>
            </button>
            {userMenuOpen ? (
              <div className="user-menu-panel" role="menu">
                <span className="user-menu-email">{user.email}</span>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    selectSection("profile");
                    setUserMenuOpen(false);
                  }}
                >
                  My Profile
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout();
                  }}
                >
                  Log out
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <main className="shell-content" aria-labelledby="shell-page-title">
          <div className="shell-page-heading">
            <div>
              <span className="header-kicker">Workspace / {activeItem.label}</span>
              <h1 id="shell-page-title">{activeItem.label}</h1>
            </div>
            <span className={`coming-soon-badge${["recipes", "equipment", "sessions"].includes(activeSection) ? " is-live" : ""}`}>
              {["recipes", "equipment", "sessions"].includes(activeSection) ? "Live" : "Placeholder"}
            </span>
          </div>

          {error ? <p className="error-message shell-error" role="alert">{error}</p> : null}

          {activeSection === "dashboard" ? (
            <DashboardView onNavigate={selectSection} onSessionExpired={onSessionExpired} />
          ) : activeSection === "profile" ? (
            <ProfileView onSessionExpired={onSessionExpired} />
          ) : activeSection === "recipes" ? (
            <RecipeView onSessionExpired={onSessionExpired} />
          ) : activeSection === "equipment" ? (
            <EquipmentView onSessionExpired={onSessionExpired} />
          ) : activeSection === "sessions" ? (
            <SessionView onSessionExpired={onSessionExpired} />
          ) : (
            <section className="placeholder-panel" aria-describedby="placeholder-description">
              <span className="placeholder-icon" aria-hidden="true">{activeItem.label.slice(0, 1)}</span>
              <h2>{activeItem.label} is ready for its feature task</h2>
              <p id="placeholder-description" className="muted">{activeItem.hint}. This authenticated shell is in place while the feature implementation is prepared.</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function EquipmentView({ onSessionExpired }: { onSessionExpired: () => void }) {
  const [items, setItems] = useState<import("@heisenberg/contracts").Equipment[]>([]);
  const [selected, setSelected] = useState<import("@heisenberg/contracts").Equipment | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [condition, setCondition] = useState("");
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadEquipment() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/equipment", { credentials: "include" });
        const payload = await readApiPayload(response);
        if (response.status === 401) {
          onSessionExpired();
          return;
        }
        if (!response.ok) throw new Error(errorMessage(payload, "Unable to load equipment."));
        const loaded = equipmentFromPayload(payload);
        if (!loaded) throw new Error("The equipment response was invalid.");
        if (active) setItems(loaded);
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : "Unable to load equipment.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadEquipment();
    return () => { active = false; };
  }, [onSessionExpired, retryKey]);

  function resetForm() {
    setSelected(null);
    setName("");
    setType("");
    setCondition("");
    setAvailable(true);
    setError(null);
  }

  function editItem(item: import("@heisenberg/contracts").Equipment) {
    setSelected(item);
    setName(item.name);
    setType(item.type);
    setCondition(item.condition);
    setAvailable(item.available);
    setError(null);
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!name.trim() || !type.trim() || !condition.trim()) {
      setError("Enter a name, type, and condition.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(selected ? `/api/equipment/${selected.id}` : "/api/equipment", {
        method: selected ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type: type.trim(), condition: condition.trim(), available }),
      });
      const payload = await readApiPayload(response);
      if (response.status === 401) { onSessionExpired(); return; }
      const saved = equipmentItemFromPayload(payload);
      if (!response.ok || !saved) throw new Error(errorMessage(payload, "Unable to save equipment."));
      setItems((current) => selected ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      editItem(saved);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save equipment.");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(item: import("@heisenberg/contracts").Equipment) {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    setError(null);
    try {
      const response = await fetch(`/api/equipment/${item.id}`, { method: "DELETE", credentials: "include" });
      const payload = await readApiPayload(response);
      if (response.status === 401) { onSessionExpired(); return; }
      if (!response.ok) throw new Error(errorMessage(payload, "Unable to delete equipment."));
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      if (selected?.id === item.id) resetForm();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete equipment.");
    }
  }

  if (loading) return <section className="equipment-panel" aria-live="polite">Loading equipment...</section>;

  return (
    <div className="equipment-view">
      {error ? <p className="error-message" role="alert">{error}</p> : null}
      <div className="equipment-layout">
        <section className="equipment-panel" aria-labelledby="equipment-list-title">
          <div className="dashboard-section-heading">
            <div><span className="header-kicker">Owned inventory</span><h2 id="equipment-list-title">Your equipment</h2></div>
            <button className="secondary-button" type="button" onClick={resetForm}>New item</button>
          </div>
          {items.length === 0 ? <p className="muted">No equipment yet. Add your first fictional inventory item.</p> : (
            <div className="equipment-list">
              {items.map((item) => (
                <article className={`equipment-list-item${selected?.id === item.id ? " is-selected" : ""}`} key={item.id}>
                  <button className="equipment-select-button" type="button" onClick={() => editItem(item)}>
                    <strong>{item.name}</strong><span>{item.type} · {item.condition}</span>
                  </button>
                  <span className={`availability-badge${item.available ? " is-available" : ""}`}>{item.available ? "Available" : "Unavailable"}</span>
                  <button className="danger-text-button" type="button" onClick={() => void removeItem(item)}>Delete</button>
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="equipment-panel" aria-labelledby="equipment-editor-title">
          <div className="dashboard-section-heading"><div><span className="header-kicker">Inventory editor</span><h2 id="equipment-editor-title">{selected ? "Edit equipment" : "Add equipment"}</h2></div></div>
          <form className="equipment-form" onSubmit={(event) => void saveItem(event)}>
            <label htmlFor="equipment-name">Name</label><input id="equipment-name" value={name} maxLength={255} onChange={(event) => setName(event.target.value)} required />
            <label htmlFor="equipment-type">Type</label><input id="equipment-type" value={type} maxLength={100} onChange={(event) => setType(event.target.value)} required />
            <label htmlFor="equipment-condition">Condition</label><input id="equipment-condition" value={condition} maxLength={100} onChange={(event) => setCondition(event.target.value)} required />
            <label className="availability-toggle"><input type="checkbox" checked={available} onChange={(event) => setAvailable(event.target.checked)} /> Available in inventory</label>
            <button type="submit" disabled={saving}>{saving ? "Saving..." : selected ? "Save changes" : "Add equipment"}</button>
          </form>
        </section>
      </div>
    </div>
  );
}

function SessionView({ onSessionExpired }: { onSessionExpired: () => void }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selected, setSelected] = useState<Session | null>(null);
  const [progress, setProgress] = useState<SessionProgress | null>(null);
  const [lastOutcome, setLastOutcome] = useState<{ success: boolean; action: SimulationAction; effectiveProbability: number; equipmentModifier: number } | null>(null);
  const [recipeId, setRecipeId] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadSessionData() {
      setLoading(true);
      setError(null);
      try {
        const responses = await Promise.all([
          fetch("/api/sessions", { credentials: "include" }),
          fetch("/api/recipes", { credentials: "include" }),
          fetch("/api/operators", { credentials: "include" }),
          fetch("/api/equipment", { credentials: "include" }),
        ]);
        const payloads = await Promise.all(responses.map(readApiPayload));
        if (responses.some((response) => response.status === 401)) {
          onSessionExpired();
          return;
        }
        if (responses.some((response) => !response.ok)) throw new Error("Unable to load session setup data.");
        const loadedSessions = sessionsFromPayload(payloads[0]);
        const loadedRecipes = recipesFromPayload(payloads[1]);
        const loadedOperators = operatorsFromPayload(payloads[2]);
        const loadedEquipment = equipmentFromPayload(payloads[3]);
        if (!loadedSessions || !loadedRecipes || !loadedOperators || !loadedEquipment) throw new Error("A session setup response was invalid.");
        if (active) {
          setSessions(loadedSessions);
          setRecipes(loadedRecipes);
          setOperators(loadedOperators);
          setEquipment(loadedEquipment);
          setRecipeId((current) => current || loadedRecipes[0]?.id || "");
          setOperatorId((current) => current || loadedOperators[0]?.id || "");
        }
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : "Unable to load sessions.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadSessionData();
    return () => { active = false; };
  }, [onSessionExpired, retryKey]);

  async function selectSession(session: Session) {
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${session.id}`, { credentials: "include" });
      const payload = await readApiPayload(response);
      if (response.status === 401) { onSessionExpired(); return; }
      const detail = sessionFromPayload(payload);
      if (!response.ok || !detail) throw new Error(errorMessage(payload, "Unable to load session."));
      setSelected(detail);
      await loadProgress(detail.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load session.");
    }
  }

  async function loadProgress(sessionId: string) {
    const response = await fetch(`/api/sessions/${sessionId}/progress`, { credentials: "include" });
    const payload = await readApiPayload(response);
    if (response.status === 401) { onSessionExpired(); return; }
    const loaded = sessionProgressFromPayload(payload);
    if (!response.ok || !loaded) throw new Error(errorMessage(payload, "Unable to load session progress."));
    setProgress(loaded);
  }

  async function createNewSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!recipeId || !operatorId) {
      setError("Select a recipe and operator before creating a session.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, operatorId, equipmentId: equipmentId ? Number(equipmentId) : null }),
      });
      const payload = await readApiPayload(response);
      if (response.status === 401) { onSessionExpired(); return; }
      const created = sessionFromPayload(payload);
      if (!response.ok || !created) throw new Error(errorMessage(payload, "Unable to create session."));
      setSessions((current) => [created, ...current]);
      setSelected(created);
      await loadProgress(created.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create session.");
    } finally {
      setSaving(false);
    }
  }

  async function runAction(action: "prepare" | "start" | "pause" | "resume" | "abort") {
    if (!selected) return;
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${selected.id}/${action}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedRevision: selected.revision }),
      });
      const payload = await readApiPayload(response);
      if (response.status === 401) { onSessionExpired(); return; }
      const updated = sessionFromPayload(payload);
      if (!response.ok || !updated) throw new Error(errorMessage(payload, "Unable to update session."));
      setSelected(updated);
      setSessions((current) => current.map((session) => session.id === updated.id ? updated : session));
      await loadProgress(updated.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update session.");
    }
  }

  async function advance(action: SimulationAction) {
    if (!selected || !progress || advancing) return;
    setAdvancing(true);
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${selected.id}/advance`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedRevision: progress.revision, action }),
      });
      const payload = await readApiPayload(response);
      if (response.status === 401) { onSessionExpired(); return; }
      const result = sessionAdvanceFromPayload(payload);
      if (!response.ok || !result) throw new Error(errorMessage(payload, "Unable to resolve turn."));
      setProgress(result.progress);
      setSessions((current) => current.map((session) => session.id === selected.id ? { ...session, status: result.progress.status, revision: result.progress.revision } : session));
      await selectSession({ ...selected, status: result.progress.status, revision: result.progress.revision });
      setLastOutcome(result.outcome);
    } catch (requestError) {
      if (requestError instanceof Error) setError(requestError.message);
      else setError("Unable to resolve turn.");
      if (selected) {
        try { await loadProgress(selected.id); } catch { /* preserve the original error */ }
      }
    } finally {
      setAdvancing(false);
    }
  }

  if (loading) return <section className="session-panel" aria-live="polite">Loading sessions...</section>;

  return (
    <div className="session-view">
      {error ? <p className="error-message" role="alert">{error}</p> : null}
      <div className="session-layout">
        <section className="session-panel" aria-labelledby="session-list-title">
          <div className="dashboard-section-heading"><div><span className="header-kicker">Pre-gameplay workspace</span><h2 id="session-list-title">Your sessions</h2></div></div>
          {sessions.length === 0 ? <p className="muted">No sessions yet. Set up your first session below.</p> : (
            <div className="session-list">
              {sessions.map((session) => (
                <button className={`session-list-item${selected?.id === session.id ? " is-selected" : ""}`} type="button" key={session.id} onClick={() => { setLastOutcome(null); void selectSession(session); }}>
                  <strong>{session.recipeTitle}</strong><span>{session.operator.displayName}</span><em>{session.status}</em>
                </button>
              ))}
            </div>
          )}
        </section>
        <section className="session-panel" aria-labelledby="session-create-title">
          <div className="dashboard-section-heading"><div><span className="header-kicker">Setup</span><h2 id="session-create-title">Create a draft</h2></div></div>
          <form className="session-form" onSubmit={(event) => void createNewSession(event)}>
            <label htmlFor="session-recipe">Recipe</label>
            <select id="session-recipe" value={recipeId} onChange={(event) => setRecipeId(event.target.value)} required>
              <option value="">Select a recipe</option>{recipes.map((recipe) => <option value={recipe.id} key={recipe.id}>{recipe.title}</option>)}
            </select>
            <label htmlFor="session-operator">Operator</label>
            <select id="session-operator" value={operatorId} onChange={(event) => setOperatorId(event.target.value)} required>
              <option value="">Select an operator</option>{operators.map((operator) => <option value={operator.id} key={operator.id}>{operator.displayName}</option>)}
            </select>
            <label htmlFor="session-equipment">Equipment <span className="muted">(optional, not reserved)</span></label>
            <select id="session-equipment" value={equipmentId} onChange={(event) => setEquipmentId(event.target.value)}>
              <option value="">No equipment</option>{equipment.map((item) => <option value={item.id} key={item.id}>{item.name} — {item.available ? "Available" : "Unavailable"}</option>)}
            </select>
            <button type="submit" disabled={saving || recipes.length === 0 || operators.length === 0}>{saving ? "Creating..." : "Create draft session"}</button>
          </form>
        </section>
      </div>
      {selected ? (
        <section className="session-panel session-detail" aria-labelledby="session-detail-title">
          <div className="dashboard-section-heading"><div><span className="header-kicker">Session detail</span><h2 id="session-detail-title">{selected.recipeTitle}</h2></div><span className="session-status">{selected.status}</span></div>
          <dl className="session-fields"><div><dt>Operator</dt><dd>{selected.operator.displayName}</dd></div><div><dt>Equipment</dt><dd>{selected.equipmentName ?? "None selected"}</dd></div><div><dt>Revision</dt><dd>{selected.revision}</dd></div></dl>
          <div className="session-actions">
            {selected.status === "DRAFT" ? <button type="button" onClick={() => void runAction("prepare")}>Prepare</button> : null}
            {selected.status === "READY" ? <button type="button" onClick={() => void runAction("start")}>Start</button> : null}
            {selected.status === "RUNNING" ? <button type="button" onClick={() => void runAction("pause")}>Pause</button> : null}
            {selected.status === "PAUSED" ? <button type="button" onClick={() => void runAction("resume")}>Resume</button> : null}
            {!["ABORTED", "COMPLETED", "FAILED"].includes(selected.status) ? <button className="danger-action" type="button" onClick={() => void runAction("abort")}>Abort</button> : null}
          </div>
          {progress ? (
            <div className="simulation-progress" aria-live="polite">
              <div className="dashboard-section-heading"><div><span className="header-kicker">Simulation Engine</span><h3>Step progress</h3></div><span className="session-status">{progress.completedSteps}/{progress.totalSteps}</span></div>
              {progress.nextStep ? <p className="current-step"><strong>Next fictional step:</strong> {progress.nextStep.label}{progress.nextStep.description ? ` — ${progress.nextStep.description}` : ""}</p> : <p className="muted">No unfinished steps remain.</p>}
              {selected.status === "PAUSED" ? <p className="muted">Resume the session before choosing an action.</p> : null}
              {selected.status === "FAILED" ? <p className="error-message">This session failed. The failed step remains unfinished; retry is not available in V1.</p> : null}
              {selected.status === "COMPLETED" ? <p className="success-message">This fictional session is complete.</p> : null}
              {lastOutcome ? <p className={lastOutcome.success ? "success-message" : "error-message"} role="status">{lastOutcome.success ? "Turn succeeded" : "Turn failed"}: {lastOutcome.action} at {lastOutcome.effectiveProbability}% effective probability ({lastOutcome.equipmentModifier >= 0 ? "+" : ""}{lastOutcome.equipmentModifier}% equipment modifier).</p> : null}
              {progress.availableActions.length > 0 ? <div className="simulation-actions"><p className="muted">Choose an abstract action. Base probabilities: Careful 85%, Balanced 75%, Bold 65%. Available selected equipment adds 5 percentage points, capped at 95%.</p>{progress.availableActions.map((action) => <button type="button" key={action} disabled={advancing} onClick={() => void advance(action)}>{advancing ? "Resolving..." : action}</button>)}</div> : null}
            </div>
          ) : null}
          <div className="session-events"><h3>Lifecycle events</h3><ol>{(selected.events ?? []).map((event) => <li key={event.id}><strong>{event.action}</strong> — {event.fromStatus ?? "new"} → {event.toStatus} <span>revision {event.revision}</span></li>)}</ol></div>
        </section>
      ) : null}
    </div>
  );
}

function RecipeView({ onSessionExpired }: { onSessionExpired: () => void }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState<RecipeStepInput[]>([emptyRecipeStep()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadRecipes() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/recipes", { credentials: "include" });
        if (response.status === 401) {
          onSessionExpired();
          return;
        }
        const payload = await readApiPayload(response);
        if (!response.ok) {
          throw new Error(errorMessage(payload, "Unable to load recipes."));
        }
        const loadedRecipes = recipesFromPayload(payload);
        if (!loadedRecipes) {
          throw new Error("The recipes response was invalid.");
        }
        if (active) {
          setRecipes(loadedRecipes);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load recipes.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadRecipes();
    return () => {
      active = false;
    };
  }, [onSessionExpired, retryKey]);

  function startNewRecipe() {
    setSelectedRecipe(null);
    setTitle("");
    setSteps([emptyRecipeStep()]);
    setError(null);
  }

  function editRecipe(recipe: Recipe) {
    setSelectedRecipe(recipe);
    setTitle(recipe.title);
    setSteps(recipe.steps.map((step) => ({ label: step.label, description: step.description ?? "" })));
    setError(null);
  }

  function updateStep(index: number, field: keyof RecipeStepInput, value: string) {
    setSteps((current) => current.map((step, stepIndex) => stepIndex === index ? { ...step, [field]: value } : step));
  }

  async function saveRecipe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const normalizedSteps = steps.map((step) => ({
      label: step.label.trim(),
      description: step.description?.trim() || null,
    }));
    if (!title.trim() || normalizedSteps.some((step) => !step.label)) {
      setError("Enter a title and a label for every step.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(selectedRecipe ? `/api/recipes/${selectedRecipe.id}` : "/api/recipes", {
        method: selectedRecipe ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), steps: normalizedSteps }),
      });
      const payload = await readApiPayload(response);
      if (response.status === 401) {
        onSessionExpired();
        return;
      }
      const savedRecipe = recipeFromPayload(payload);
      if (!response.ok || !savedRecipe) {
        throw new Error(errorMessage(payload, "Unable to save recipe."));
      }
      setRecipes((current) => selectedRecipe
        ? current.map((recipe) => recipe.id === savedRecipe.id ? savedRecipe : recipe)
        : [savedRecipe, ...current]);
      editRecipe(savedRecipe);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save recipe.");
    } finally {
      setSaving(false);
    }
  }

  async function removeRecipe(recipe: Recipe) {
    if (!window.confirm(`Delete ${recipe.title}?`)) {
      return;
    }
    setError(null);
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await readApiPayload(response);
      if (response.status === 401) {
        onSessionExpired();
        return;
      }
      if (!response.ok) {
        throw new Error(errorMessage(payload, "Unable to delete recipe."));
      }
      setRecipes((current) => current.filter((item) => item.id !== recipe.id));
      if (selectedRecipe?.id === recipe.id) {
        startNewRecipe();
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete recipe.");
    }
  }

  if (loading) {
    return <section className="recipe-panel" aria-live="polite">Loading recipes...</section>;
  }

  return (
    <div className="recipe-view">
      {error ? <p className="error-message" role="alert">{error}</p> : null}
      <div className="recipe-layout">
        <section className="recipe-panel recipe-list-panel" aria-labelledby="recipe-list-title">
          <div className="dashboard-section-heading">
            <div>
              <span className="header-kicker">Owned recipes</span>
              <h2 id="recipe-list-title">Your recipes</h2>
            </div>
            <button className="secondary-button" type="button" onClick={startNewRecipe}>New recipe</button>
          </div>
          {recipes.length === 0 ? <p className="muted">No recipes yet. Create your first fictional workflow.</p> : (
            <div className="recipe-list">
              {recipes.map((recipe) => (
                <article className={`recipe-list-item${selectedRecipe?.id === recipe.id ? " is-selected" : ""}`} key={recipe.id}>
                  <button type="button" className="recipe-select-button" onClick={() => editRecipe(recipe)}>
                    <strong>{recipe.title}</strong>
                    <span>{recipe.steps.length} {recipe.steps.length === 1 ? "step" : "steps"}</span>
                  </button>
                  <button type="button" className="danger-text-button" onClick={() => void removeRecipe(recipe)}>Delete</button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="recipe-panel" aria-labelledby="recipe-editor-title">
          <div className="dashboard-section-heading">
            <div>
              <span className="header-kicker">Recipe editor</span>
              <h2 id="recipe-editor-title">{selectedRecipe ? "Edit recipe" : "Create recipe"}</h2>
            </div>
          </div>
          <form className="recipe-form" onSubmit={(event) => void saveRecipe(event)}>
            <label htmlFor="recipe-title">Title</label>
            <input id="recipe-title" value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} required />
            <div className="recipe-steps-heading">
              <h3>Ordered steps</h3>
              <button className="secondary-button" type="button" onClick={() => setSteps((current) => [...current, emptyRecipeStep()])}>Add step</button>
            </div>
            <div className="recipe-step-editor">
              {steps.map((step, index) => (
                <fieldset key={index} className="recipe-step-fieldset">
                  <legend>Step {index + 1}</legend>
                  <label htmlFor={`recipe-step-label-${index}`}>Label</label>
                  <input id={`recipe-step-label-${index}`} value={step.label} maxLength={200} onChange={(event) => updateStep(index, "label", event.target.value)} required />
                  <label htmlFor={`recipe-step-description-${index}`}>Description <span className="muted">(optional)</span></label>
                  <textarea id={`recipe-step-description-${index}`} value={step.description ?? ""} maxLength={2000} onChange={(event) => updateStep(index, "description", event.target.value)} rows={2} />
                  {steps.length > 1 ? <button className="danger-text-button" type="button" onClick={() => setSteps((current) => current.filter((_, stepIndex) => stepIndex !== index))}>Remove step</button> : null}
                </fieldset>
              ))}
            </div>
            <button type="submit" disabled={saving}>{saving ? "Saving..." : selectedRecipe ? "Save changes" : "Create recipe"}</button>
          </form>
        </section>
      </div>
    </div>
  );
}

function DashboardView({
  onNavigate,
  onSessionExpired,
}: {
  onNavigate: (section: ShellSection) => void;
  onSessionExpired: () => void;
}) {
  const [summary, setSummary] = useState<DashboardSummary["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/dashboard/summary", { credentials: "include" });
        if (response.status === 401) {
          onSessionExpired();
          return;
        }
        if (!response.ok) {
          throw new Error("Unable to load your dashboard.");
        }

        const dashboard = dashboardSummaryFromPayload(await readApiPayload(response));
        if (!dashboard) {
          throw new Error("The dashboard response was invalid.");
        }
        if (active) {
          setSummary(dashboard.data);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load your dashboard.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, [onSessionExpired, retryKey]);

  if (loading) {
    return <section className="dashboard-panel" aria-live="polite">Loading dashboard...</section>;
  }

  if (error || !summary) {
    return (
      <section className="dashboard-panel" aria-labelledby="dashboard-error-title">
        <h2 id="dashboard-error-title">Dashboard unavailable</h2>
        <p className="error-message" role="alert">{error ?? "Unable to load your dashboard."}</p>
        <button className="secondary-button" type="button" onClick={() => setRetryKey((key) => key + 1)}>
          Try again
        </button>
      </section>
    );
  }

  const metrics = [
    {
      id: "equipment",
      label: "Equipment catalog",
      metric: summary.equipment,
      description: dashboardMetricDescription(summary.equipment, "Total catalog items", "Equipment data unavailable"),
    },
    {
      id: "recipes",
      label: "Recipes",
      metric: summary.recipes,
      description: dashboardMetricDescription(summary.recipes, "Your recipes", "Recipe feature not available yet"),
    },
    {
      id: "sessions",
      label: "Sessions",
      metric: summary.sessions,
      description: dashboardMetricDescription(summary.sessions, "Your active sessions", "Session feature not available yet"),
    },
    {
      id: "completed-sessions",
      label: "Completed sessions",
      metric: summary.completedSessions,
      description: dashboardMetricDescription(summary.completedSessions, "Your completed sessions", "Session history not available yet"),
    },
  ];

  return (
    <div className="dashboard-view">
      <div className="dashboard-metrics">
        {metrics.map((metric) => (
          <article className="dashboard-metric" key={metric.id}>
            <span className="dashboard-metric-label">{metric.label}</span>
            <strong>{dashboardMetricValue(metric.metric)}</strong>
            <span className="dashboard-metric-description">{metric.description}</span>
          </article>
        ))}
      </div>

      <section className="dashboard-panel activity-panel" aria-labelledby="activity-title">
        <div className="dashboard-section-heading">
          <div>
            <span className="header-kicker">History</span>
            <h2 id="activity-title">Recent activity</h2>
          </div>
        </div>
        {dashboardHasAvailableActivity(summary) ? (
          <ul className="activity-list">
            {summary.recentActivity.items.map((item) => <li key={item.id}>{item.label}</li>)}
          </ul>
        ) : (
          <p className="muted">Recent activity will appear when session history is available.</p>
        )}
      </section>

      <section className="dashboard-panel quick-links" aria-labelledby="quick-links-title">
        <div className="dashboard-section-heading">
          <div>
            <span className="header-kicker">Next steps</span>
            <h2 id="quick-links-title">Explore the workspace</h2>
          </div>
        </div>
        <div className="quick-link-grid">
          <button type="button" onClick={() => onNavigate("recipes")}>Browse Recipes</button>
          <button type="button" onClick={() => onNavigate("equipment")}>View Equipment</button>
          <button type="button" onClick={() => onNavigate("sessions")}>Open Sessions</button>
        </div>
      </section>
    </div>
  );
}

function ProfileView({ onSessionExpired }: { onSessionExpired: () => void }) {
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        if (response.status === 401) {
          onSessionExpired();
          return;
        }
        if (!response.ok) {
          throw new Error("Unable to load your profile.");
        }

        const currentUser = publicUserFromPayload(await readApiPayload(response));
        if (!currentUser) {
          throw new Error("The profile response was invalid.");
        }
        if (active) {
          setProfile(currentUser);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load your profile.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, [onSessionExpired, retryKey]);

  if (loading) {
    return <section className="profile-panel" aria-live="polite">Loading profile...</section>;
  }

  if (error || !profile) {
    return (
      <section className="profile-panel" aria-labelledby="profile-error-title">
        <h2 id="profile-error-title">Profile unavailable</h2>
        <p className="error-message" role="alert">{error ?? "Unable to load your profile."}</p>
        <button className="secondary-button" type="button" onClick={() => setRetryKey((key) => key + 1)}>
          Try again
        </button>
      </section>
    );
  }

  return (
    <section className="profile-panel" aria-labelledby="profile-details-title">
      <div className="profile-intro">
        <span className="profile-avatar" aria-hidden="true">{profile.email.slice(0, 1).toUpperCase()}</span>
        <div>
          <h2 id="profile-details-title">Account details</h2>
          <p className="muted">Read-only information from your authenticated account.</p>
        </div>
      </div>
      <dl className="profile-fields">
        {getProfileFields(profile).map((field) => (
          <div className="profile-field" key={field.id}>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>
      <p className="profile-note">Profile editing is not available in V1.</p>
    </section>
  );
}

export default function App() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const handleSessionExpired = useCallback(() => {
    setUser(null);
    setMode("login");
    setError("Your session has expired. Please log in again.");
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        if (response.status === 401) {
          return;
        }
        if (!response.ok) {
          throw new Error("Unable to restore authentication state.");
        }

        const currentUser = publicUserFromPayload(await readApiPayload(response));
        if (active && currentUser) {
          setUser(currentUser);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load the application.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadCurrentUser();
    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    setError(null);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok && response.status !== 401) {
        const payload = await readApiPayload(response);
        throw new Error(errorMessage(payload, "Unable to log out."));
      }
      setUser(null);
      setMode("login");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to log out.");
    }
  }

  if (loading) {
    return (
      <main className="app-shell">
        <section className="status-card" aria-live="polite">Loading authentication...</section>
      </main>
    );
  }

  if (user) {
    return <ApplicationShell user={user} error={error} onLogout={() => void logout()} onSessionExpired={handleSessionExpired} />;
  }

  function handleAuthenticated(nextUser: PublicUser) {
    setError(null);
    setUser(nextUser);
  }

  return (
    <>
      <AuthForm mode={mode} onModeChange={setMode} onAuthenticated={handleAuthenticated} />
      {error ? (
        <div className="app-shell" aria-live="polite">
          <p className="error-message" role="alert">{error}</p>
        </div>
      ) : null}
    </>
  );
}
