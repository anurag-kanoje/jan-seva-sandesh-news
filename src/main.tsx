import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  document.getElementById("root")!.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#111;color:#fff;text-align:center;padding:2rem;">
      <div>
        <h1 style="font-size:1.5rem;margin-bottom:1rem;">⚠️ Configuration Error</h1>
        <p>Supabase environment variables are missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.</p>
      </div>
    </div>`;
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}
