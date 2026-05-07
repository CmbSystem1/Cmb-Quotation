import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";

import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
import Inventory from "./pages/Inventory";
import Quotations from "./pages/Quotations";
import Login from "./pages/Login";

// ❌ REMOVE THIS (NOT NEEDED ANYMORE)
// import EditQuotation from "./pages/EditQuotation";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>

  <Route path="/login" element={<Login />} />

  {/* DASHBOARD */}
  <Route
    path="/"
    element={
      <PrivateRoute>
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </PrivateRoute>
    }
  />

  {/* CLIENTS */}
  <Route
    path="/clients"
    element={
      <PrivateRoute>
        <AppLayout>
          <Clients />
        </AppLayout>
      </PrivateRoute>
    }
  />

  {/* CLIENT DETAILS */}
  <Route
    path="/client/:id"
    element={
      <PrivateRoute>
        <AppLayout>
          <ClientDetails />
        </AppLayout>
      </PrivateRoute>
    }
  />

  {/* INVENTORY */}
  <Route
    path="/inventory"
    element={
      <PrivateRoute>
        <AppLayout>
          <Inventory />
        </AppLayout>
      </PrivateRoute>
    }
  />

  {/* QUOTATIONS */}
  <Route
    path="/quotations"
    element={
      <PrivateRoute>
        <AppLayout>
          <Quotations />
        </AppLayout>
      </PrivateRoute>
    }
  />

  {/* NEW QUOTATION */}
  <Route
    path="/quotation/:clientId"
    element={
      <PrivateRoute>
        <AppLayout>
          <Quotations />
        </AppLayout>
      </PrivateRoute>
    }
  />

  {/* EDIT QUOTATION */}
  <Route
    path="/edit-quotation/:id"
    element={
      <PrivateRoute>
        <AppLayout>
          <Quotations />
        </AppLayout>
      </PrivateRoute>
    }
  />

</Routes>
  );
}

export default App;