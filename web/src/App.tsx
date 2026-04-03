import { Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import SyncPage from "./pages/SyncPage";
import CreditCardExpenses from "./pages/CreditCardExpenses";
import CategoryTransactions from "./pages/CategoryTransactions";
import Analytics from "./pages/Analytics";
import AppLayout from "./components/AppLayout";

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sync" element={<SyncPage />} />
        <Route path="/credit-card" element={<CreditCardExpenses />} />
        <Route path="/credit-card/category/:categoryName" element={<CategoryTransactions />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>
      <Route path="/spending" element={<Navigate to="/credit-card" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
