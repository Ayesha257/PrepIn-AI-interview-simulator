import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { GoogleOAuthProvider } from "@react-oauth/google";

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
if (!googleClientId) {
  // eslint-disable-next-line no-console
  console.warn("REACT_APP_GOOGLE_CLIENT_ID is not set — Google login will not work.");
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId || ""}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);

reportWebVitals();
