import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { installDatabase } from "./app/data/database";
  import "./styles/index.css";

  installDatabase();

  createRoot(document.getElementById("root")!).render(<App />);
