import React from "react";
import { Info, Moon, ShieldCheck, Sun } from "lucide-react";

export default function Header({ onAbout, darkMode, onToggleTheme }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brandMark"><ShieldCheck size={22} /></div>
        <div>
          <strong>ToxiGuard</strong>
          <span>In-silico toxicity screening</span>
        </div>
      </div>

      <div className="topActions">
        <button className="ghost" onClick={onAbout}>
          <Info size={17} />
          About
        </button>

        <button
          className="iconBtn"
          onClick={onToggleTheme}
          aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
          title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
