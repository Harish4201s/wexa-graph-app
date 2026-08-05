import { NavLink } from 'react-router-dom';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-brand-600 text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            DG
          </div>
          <span className="text-lg font-semibold tracking-tight">DevGraph</span>
        </div>
        <nav className="flex gap-1">
          <NavLink to="/" end className={linkClass}>
            Developers
          </NavLink>
          <NavLink to="/projects" className={linkClass}>
            Projects
          </NavLink>
          <NavLink to="/graph" className={linkClass}>
            Skill Graph
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
