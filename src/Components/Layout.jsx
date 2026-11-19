// src/components/Layout.jsx
import Footer from "./Footer.jsx";
import { Outlet } from "react-router";
import Navbar from "./Navbar.jsx";

function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-content">
        <div className="page-panel">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Layout;