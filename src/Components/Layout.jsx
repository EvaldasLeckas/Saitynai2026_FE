// src/components/Layout.jsx
import Footer from "./Footer.jsx";
import { Link, Outlet } from "react-router";

export default function Layout() {
  return (
    <>
      <nav>
        {/* Available for everyone */}
        <Link to="/">Home</Link> 
        <Link to="/createSession">Create Session</Link> 
        
        {/* Lobby owner functions */}
        <Link to="/Session">My Sessions</Link> 
        
        {/* Admin functions */}
        <Link to="/Users">All Users</Link> 
      </nav>
      <Outlet />
      <Footer></Footer>
    </>
  );
}