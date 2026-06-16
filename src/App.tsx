import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Chat from "./Chat";
import Admin from "./Admin";

function NavBar() {
  const location = useLocation();

  return (
    <nav style={navStyles.nav}>
      <span style={navStyles.logo}>❄️ HVAC AI</span>
      <div style={navStyles.links}>
        <Link
          to="/"
          style={{
            ...navStyles.link,
            ...(location.pathname === "/" ? navStyles.activeLink : {}),
          }}
        >
          💬 Chat
        </Link>
        <Link
          to="/admin"
          style={{
            ...navStyles.link,
            ...(location.pathname === "/admin" ? navStyles.activeLink : {}),
          }}
        >
          📚 Admin
        </Link>
      </div>
    </nav>
  );
}

const navStyles: Record<string, React.CSSProperties> = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.8rem 2rem",
    backgroundColor: "#16213e",
    borderBottom: "1px solid #0f3460",
  },
  logo: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#ffffff",
  },
  links: {
    display: "flex",
    gap: "1rem",
  },
  link: {
    color: "#888",
    textDecoration: "none",
    padding: "0.4rem 1rem",
    borderRadius: 6,
    fontSize: "0.9rem",
    transition: "all 0.3s",
  },
  activeLink: {
    color: "#ffffff",
    backgroundColor: "#0f3460",
  },
};

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Chat />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}