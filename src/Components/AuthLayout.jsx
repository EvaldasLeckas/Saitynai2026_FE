import { Outlet } from "react-router";
import Footer from "./Footer.jsx";

export default function AuthLayout() {
  return (
    <>
    <div className="page-content">
    <div className="auth-layout">
      <Outlet />
    </div>
    </div>
    <Footer></Footer>
    </>
  );
}