import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ArrowUpRight, Menu, X, LayoutGrid } from "lucide-react";
import { Brand } from "./UI";
import ColorModeToggle from "./ColorModeToggle";

export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);
  useEffect(() => {
    if (!location.hash) return;
    let target;
    try {
      target = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    requestAnimationFrame(() =>
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth" }),
    );
  }, [location]);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="nav-inner">
          <Brand />
          <nav
            className={`main-nav ${open ? "is-open" : ""}`}
            aria-label="Main navigation"
          >
            <NavLink
              to="/create"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Explore products
            </NavLink>
            <Link to="/#how-it-works">How it works</Link>
            <NavLink to="/dashboard">
              <LayoutGrid size={15} />
              My workspace
            </NavLink>
          </nav>
          <div className="nav-actions">
            <ColorModeToggle />
            <Link to="/create" className="btn btn-primary btn-small">
              Create your page <ArrowUpRight size={16} />
            </Link>
            <button
              className="icon-button mobile-menu"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <Brand />
          <span>A little page. A lasting impression.</span>
          <div>
            <span className="footer-demo">
              <i /> Built for your next connection
            </span>
            <Link to="/about-demo">
              About this prototype <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
