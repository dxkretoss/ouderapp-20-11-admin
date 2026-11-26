import { lazy, Suspense } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { RequireAdmin } from "@/components/RequireAdmin";
import { Spinner } from "@/components/ui";
import Login from "@/pages/Login";

// Admin screens are only downloaded after sign-in.
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Users = lazy(() => import("@/pages/Users"));
const UserDetail = lazy(() => import("@/pages/UserDetail"));
const Settings = lazy(() => import("@/pages/Settings"));

function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-lg font-bold">Page not found</p>
      <Link to="/" className="mt-3 inline-block text-sm font-semibold text-brand underline">Back to the dashboard</Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAdmin><Layout /></RequireAdmin>}>
        <Route index element={<Suspense fallback={<Spinner />}><Dashboard /></Suspense>} />
        <Route path="users" element={<Suspense fallback={<Spinner />}><Users /></Suspense>} />
        <Route path="users/:id" element={<Suspense fallback={<Spinner />}><UserDetail /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<Spinner />}><Settings /></Suspense>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
