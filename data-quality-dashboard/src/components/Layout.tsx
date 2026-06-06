import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="app-layout">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="nav-logo">DQ</span>
          <span className="nav-title">Data Quality</span>
        </div>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Dashboard
          </NavLink>
          <NavLink to="/rules" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Rules
          </NavLink>
          <NavLink to="/rules/new" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            + New Rule
          </NavLink>
        </div>
        <div className="nav-user">
          <span className="nav-email">{user?.email}</span>
          <button onClick={signOut} className="btn btn-outline btn-sm">Logout</button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
