import {
  Folder,
  FolderPlus,
  LogOut01,
  SearchLg,
  UploadCloud01,
} from "@untitledui/icons";
import { NavLink, Route, Routes } from "react-router-dom";
import Button from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { cx } from "@/utils/cx";
import { useAuth } from "./auth/AuthContext";
import LoginPage from "./pages/LoginPage";
import ProjectListPage from "./pages/ProjectListPage";
import ProjectFormPage from "./pages/ProjectFormPage";
import ProjectViewPage from "./pages/ProjectViewPage";
import ImportProjectPage from "./pages/ImportProjectPage";
import EstimatePage from "./pages/EstimatePage";

const navigationItems = [
  { to: "/", label: "Projects", icon: Folder },
  { to: "/projects/new", label: "Add Project", icon: FolderPlus },
  { to: "/projects/import", label: "Import", icon: UploadCloud01 },
  { to: "/estimate", label: "Estimate", icon: SearchLg },
];

export default function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary_alt px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-solid text-primary_on-brand shadow-xs-skeuomorphic">
              <Folder className="size-6" />
            </div>
            <CardTitle className="mt-4">Loading your workspace</CardTitle>
            <CardDescription>
              Pulling together projects, preferences, and the good stuff.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Spinner size="lg" className="mx-auto text-brand-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-secondary_alt">
      <header className="border-b border-secondary bg-primary">
        <div className="mx-auto flex max-w-[var(--max-width-container)] flex-wrap items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-solid text-primary_on-brand shadow-xs-skeuomorphic">
              <Folder className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-primary">Effort Estimator</p>
              <p className="truncate text-xs text-tertiary">Untitled UI refresh</p>
            </div>
          </NavLink>

          <nav className="flex flex-1 flex-wrap items-center gap-2 md:justify-center">
            {navigationItems.map(({ icon: Icon, label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cx(
                    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "border border-brand bg-brand-primary text-brand-primary shadow-xs"
                      : "text-secondary hover:bg-secondary hover:text-primary",
                  )
                }
              >
                <Icon className="size-4.5" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden items-center gap-3 rounded-2xl border border-secondary bg-secondary px-3 py-2 shadow-xs sm:flex">
              <img
                src={user.picture}
                alt={user.name}
                className="size-9 rounded-full border border-secondary object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-primary">{user.name}</p>
                <p className="truncate text-xs text-tertiary">Signed in</p>
              </div>
            </div>
            <Button tone="tertiary" size="sm" iconLeading={LogOut01} onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[var(--max-width-container)] px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<ProjectListPage />} />
          <Route path="/projects/new" element={<ProjectFormPage />} />
          <Route path="/projects/import" element={<ImportProjectPage />} />
          <Route path="/projects/:id" element={<ProjectViewPage />} />
          <Route path="/projects/:id/edit" element={<ProjectFormPage />} />
          <Route path="/estimate" element={<EstimatePage />} />
        </Routes>
      </main>
    </div>
  );
}
