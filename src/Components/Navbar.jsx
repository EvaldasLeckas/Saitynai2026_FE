import { useState } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router";
import { toast } from "react-toastify";
import { FiMenu, FiX } from "react-icons/fi";
import logo from "../assets/iconele.svg";
import ConfirmModal from "./ConfirmModal";
import { logout, isAdmin, ownsLobby } from "../Utils/Api";



function Navbar() {

  useLocation();
  const [open, setOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const navigate = useNavigate();
  const closeMenu = () => setOpen(false);

const handleLogout = async () => {
  try {
    await logout();
  } catch {
    // server unreachable: token is already cleared locally, continue
  }
  setShowLogout(false);
  closeMenu();
  navigate("/login");
  toast.success("Logged out");
};

  return (
    <header className="navbar">
      <button
        type="button"
        className="navbar-burger"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? <FiX /> : <FiMenu />}
      </button>

      <Link to="/" className="navbar-logo" onClick={closeMenu}>
        <img src={logo} alt="Company logo" />
      </Link>

      <nav className={`navbar-links ${open ? "open" : ""}`}>
        <NavLink to="/createSession" onClick={closeMenu}>Create Session</NavLink>
        <NavLink to="/myprofile" onClick={closeMenu}>Profile </NavLink>

        {/* Lobby owner functions */}
        {ownsLobby() && (
        <NavLink to="/sessions/my" onClick={closeMenu}>My Sessions</NavLink>
        )}
        {/* Admin functions */}
        {isAdmin() && (
        <NavLink to="/allusers" onClick={closeMenu}>All Users</NavLink>
        )}
      </nav>

      <button className="navbar-logout" onClick={() => setShowLogout(true)}>
        Log out
      </button>
      {showLogout && (
  <ConfirmModal
    title="Log out"
    message="Are you sure you want to log out?"
    confirmLabel="Log out"
    danger={false}
    onCancel={() => setShowLogout(false)}
    onConfirm={handleLogout}
  />
)}
    </header>
    
  );
}

export default Navbar;