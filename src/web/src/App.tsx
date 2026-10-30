import { useCallback, useEffect, useState, type FormEvent } from "react";
import { dashboardSummarySchema, publicUserSchema, type DashboardSummary, type PublicUser, type Recipe, type RecipeStepInput } from "@heisenberg/contracts";
import { dashboardHasAvailableActivity, dashboardMetricDescription, dashboardMetricValue } from "./dashboard";
import { getProfileFields } from "./profile";
import { emptyRecipeStep, recipeFromPayload, recipesFromPayload } from "./recipes";

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
            <span className={`coming-soon-badge${activeSection === "recipes" ? " is-live" : ""}`}>
              {activeSection === "recipes" ? "Live" : "Placeholder"}
            </span>
          </div>

          {error ? <p className="error-message shell-error" role="alert">{error}</p> : null}

          {activeSection === "dashboard" ? (
            <DashboardView onNavigate={selectSection} onSessionExpired={onSessionExpired} />
          ) : activeSection === "profile" ? (
            <ProfileView onSessionExpired={onSessionExpired} />
          ) : activeSection === "recipes" ? (
            <RecipeView onSessionExpired={onSessionExpired} />
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
