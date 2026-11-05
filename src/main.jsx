import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import ProtectedRoute from "./Components/ProtectedRoute";


import Home from "./Pages/Home";
import Register from "./Pages/Register";
import Login from "./Pages/Login";
import Logout from "./Pages/Logout";
import CreateSession from "./Pages/CreateSession";
import AddGames from "./Pages/AddGames";
import SessionDetails from "./Pages/SessionDetails";
import Profile from "./Pages/Profile";


import Layout from "./Components/Layout";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      { path: "/", Component: Home },
      { path: "/register", Component: Register },
      { path: "/login", Component: Login },
      { path: "/logout", Component: Logout },
      {
        Component: ProtectedRoute,
        children: [
          { path: "/createSession", Component: CreateSession },
          { path: "/sessions/:id/games", Component: AddGames },
          { path: "/sessions/:id", Component: SessionDetails },
          { path: "/profile", Component: Profile },
          // later: edit session, my sessions, etc.
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