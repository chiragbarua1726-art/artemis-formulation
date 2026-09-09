import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './lib/authStore';
import { ToastContainer } from './components/ui/Toast';

// Auth
import { LoginView } from './features/auth/LoginView';
import { ProtectedRoute } from './routes/ProtectedRoute';

// MR Field App
import { MrLayout } from './components/layout/MrLayout';
import { TodayPlan } from './features/mr/TodayPlan';
import { DcrReportForm } from './features/mr/DcrReportForm';
import { TourPlanBuilder } from './features/mr/TourPlanBuilder';
import { ExpenseClaimForm } from './features/mr/ExpenseClaimForm';
import { PerformanceView } from './features/mr/PerformanceView';

// Manager / Admin Dashboard
import { ManagerLayout } from './components/layout/ManagerLayout';
import { OverviewDashboard } from './features/manager/OverviewDashboard';
import { ApprovalHub } from './features/manager/ApprovalHub';
import { TeamTrackerMap } from './features/manager/TeamTrackerMap';
import { DoctorCoverageReport } from './features/manager/DoctorCoverageReport';
import { MasterDataManager } from './features/manager/MasterDataManager';
import { MrDetailView } from './features/manager/MrDetailView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30000,
      retry: 1,
    },
  },
});

// Smart Root Redirect based on user role
const RootRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'MR') {
    return <Navigate to="/mr/today" replace />;
  }

  return <Navigate to="/manager/overview" replace />;
};

export const App: React.FC = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Auth */}
          <Route path="/login" element={<LoginView />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* MR Field App Routes (Accessible to MR, and also Manager/Admin for preview) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/mr" element={<MrLayout />}>
              <Route index element={<Navigate to="/mr/today" replace />} />
              <Route path="today" element={<TodayPlan />} />
              <Route path="dcr" element={<DcrReportForm />} />
              <Route path="tour-plan" element={<TourPlanBuilder />} />
              <Route path="expenses" element={<ExpenseClaimForm />} />
              <Route path="performance" element={<PerformanceView />} />
            </Route>
          </Route>

          {/* Manager / Admin Routes (Restricted to MANAGER & ADMIN) */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']} />}>
            <Route path="/manager" element={<ManagerLayout />}>
              <Route index element={<Navigate to="/manager/overview" replace />} />
              <Route path="overview" element={<OverviewDashboard />} />
              <Route path="approvals" element={<ApprovalHub />} />
              <Route path="tracker" element={<TeamTrackerMap />} />
              <Route path="coverage" element={<DoctorCoverageReport />} />
              <Route path="master-data" element={<MasterDataManager />} />
              <Route path="team/:id" element={<MrDetailView />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  );
};
