import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { installRelationalApi } from "./app/data/relationalApi";
  import "./styles/index.css";

  installRelationalApi();

  createRoot(document.getElementById("root")!).render(<App />);
