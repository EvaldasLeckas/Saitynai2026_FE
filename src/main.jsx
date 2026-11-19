import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import ProtectedRoute from "./Components/ProtectedRoute";

import "./index.css";


import Home from "./Pages/Home";
import Register from "./Pages/Register";
import Login from "./Pages/Login";
import CreateSession from "./Pages/CreateSession";
import AddGames from "./Pages/AddGames";
import SessionDetails from "./Pages/SessionDetails";
import Profile from "./Pages/Profile";
import AddResults from "./Pages/AddResults";
import MySessions from "./Pages/MySessions";
import AllUsers from "./Pages/AllUsers";


import AuthLayout from "./Components/AuthLayout"
import Layout from "./Components/Layout";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  // Login / Register: centered card, no navbar
  {
    Component: AuthLayout,
    children: [
      { path: "/register", Component: Register },
      { path: "/login", Component: Login },
    ],
  },

  // Main app: navbar + footer
  {
    Component: Layout,
    children: [
      { path: "/", Component: Home },
      {
        Component: ProtectedRoute,
        children: [
          { path: "/createSession", Component: CreateSession },
          { path: "/sessions/:id/games", Component: AddGames },
          { path: "/sessions/:id", Component: SessionDetails },
          { path: "/profile", Component: Profile },
          { path: "/sessions/:id/results", Component: AddResults},
          { path: "/sessions/my", Component: MySessions},
          { path: "/allusers", Component: AllUsers},
          { path: "/myprofile", Component: Profile}
        ],
      },
    ],
  },
]);
createRoot(document.getElementById("root")).render(
  <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
          <ToastContainer />

      </QueryClientProvider>
  </StrictMode>
);