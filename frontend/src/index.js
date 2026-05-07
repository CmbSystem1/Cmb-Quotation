import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter } from "react-router-dom";

const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(
  <GoogleOAuthProvider clientId="587153454202-jrd2lb5r4it1kaphge4enge8ganfj11b.apps.googleusercontent.com">
    
    <BrowserRouter>
      <App />
    </BrowserRouter>

  </GoogleOAuthProvider>
);