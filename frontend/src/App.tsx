import { Routes, Route, Link } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import LoginPage from "./pages/LoginPage";
import ProjectListPage from "./pages/ProjectListPage";
import ProjectFormPage from "./pages/ProjectFormPage";
import ProjectViewPage from "./pages/ProjectViewPage";
import ImportProjectPage from "./pages/ImportProjectPage";
import EstimatePage from "./pages/EstimatePage";

export default function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
          <Link to="/" className="text-xl font-bold text-gray-800">
            Effort Estimator
          </Link>
          <Link
            to="/"
            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            Projects
          </Link>
          <Link
            to="/projects/new"
            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            Add Project
          </Link>
          <Link
            to="/projects/import"
            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            Import
          </Link>
          <Link
            to="/estimate"
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700"
          >
            Estimate
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <img
              src={user.picture}
              alt=""
              className="w-7 h-7 rounded-full"
              referrerPolicy="no-referrer"
            />
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user.name}
            </span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">
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
