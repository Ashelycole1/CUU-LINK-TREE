import { Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/AuthContext";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AnalyticsAdmin } from "./pages/admin/AnalyticsAdmin";
import { AppearanceAdmin } from "./pages/admin/AppearanceAdmin";
import { EventsAdmin } from "./pages/admin/EventsAdmin";
import { Login } from "./pages/auth/Login";
import { Signup } from "./pages/auth/Signup";
import { Landing } from "./pages/Landing";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PublicEventPage } from "./pages/public/PublicEventPage";
import { PublicPage } from "./pages/public/PublicPage";

/**
 * Marketing and auth pages, the host dashboard under /admin, and every
 * host's public page at /:username (the Linktree URL shape).
 */
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<EventsAdmin />} />
        <Route path="appearance" element={<AppearanceAdmin />} />
        <Route path="analytics" element={<AnalyticsAdmin />} />
      </Route>
      <Route path="/:username" element={<PublicPage />} />
      <Route path="/:username/:slug" element={<PublicEventPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
