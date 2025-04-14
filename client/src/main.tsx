import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import ErrorBoundary from "./components/error-boundary";

// Add a global error handler for runtime errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Prevent the default error overlay on mobile
  if (/Mobi|Android/i.test(navigator.userAgent)) {
    // For mobile devices, prevent the default error overlay
    event.preventDefault();
  }
});

// Initialize the app with our custom error boundary
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
