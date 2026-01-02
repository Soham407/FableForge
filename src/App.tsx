import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/layout/Layout";
import LandingPage from "./pages/LandingPage";
import PreviewPage from "./pages/PreviewPage";
import StoryDirector from "./pages/StoryDirector";
import FlipbookEditor from "./pages/FlipbookEditor";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import MemoryJar from "./pages/MemoryJar";
import PhotographerPortal from "./pages/PhotographerPortal";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AppRoutes } from "./types";
import { useAuth } from "./context/AuthContext";

/**
 * FableForge App - "Our Story Books"
 * Phase 4: The Publisher - Complete
 */
function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Main flow with layout */}
        <Route
          path={AppRoutes.HOME}
          element={
            <Layout>
              <LandingPage />
            </Layout>
          }
        />

        {/* Auth routes - redirect if already logged in */}
        <Route
          path={AppRoutes.LOGIN}
          element={
            user ? (
              <Navigate to={AppRoutes.DASHBOARD} replace />
            ) : (
              <Layout>
                <AuthPage />
              </Layout>
            )
          }
        />
        <Route
          path={AppRoutes.SIGNUP}
          element={
            user ? (
              <Navigate to={AppRoutes.DASHBOARD} replace />
            ) : (
              <Layout>
                <AuthPage />
              </Layout>
            )
          }
        />

        {/* Preview page - shows AI transformation */}
        <Route
          path={AppRoutes.PREVIEW}
          element={
            <Layout>
              <PreviewPage />
            </Layout>
          }
        />

        {/* Story Director - configure story details */}
        <Route
          path={AppRoutes.DIRECTOR}
          element={
            <Layout>
              <StoryDirector />
            </Layout>
          }
        />

        {/* Flipbook Editor - minimal layout for immersive experience */}
        <Route path={AppRoutes.EDITOR} element={<FlipbookEditor />} />

        {/* Protected Routes */}
        <Route
          path={AppRoutes.DASHBOARD}
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path={AppRoutes.PROFILE}
          element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Memory Jar - Phase 3 */}
        <Route
          path={AppRoutes.MEMORY_JAR}
          element={
            <ProtectedRoute>
              <Layout>
                <MemoryJar />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* B2B Photographer Portal - Phase 3 */}
        <Route
          path={AppRoutes.PHOTOGRAPHER_PORTAL}
          element={
            <ProtectedRoute>
              <Layout>
                <PhotographerPortal />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Real Checkout Page */}
        <Route
          path={AppRoutes.CHECKOUT}
          element={
            <Layout>
              <CheckoutPage />
            </Layout>
          }
        />

        <Route
          path={AppRoutes.ORDER_SUCCESS}
          element={
            <Layout>
              <OrderSuccessPage />
            </Layout>
          }
        />

        {/* 404 Catch-all */}
        <Route
          path="*"
          element={
            <Layout>
              <NotFound />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
