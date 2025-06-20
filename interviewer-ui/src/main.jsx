import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  autocapture: false,
  capture_pageview: true,
  capture_exceptions: false,
  capture_performance: false,
  capture_console_log_exceptions: false,
  disable_session_recording: false,
  session_recording: {
    maskAllText: true,
    blockClass: "ph-block",
    maskTextClass: "ph-mask",
  },
  debug: false,
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </StrictMode>
);
