import { Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import Spending from "./pages/Spending";

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/spending" element={<Spending />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
