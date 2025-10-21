
import { createRoot } from "react-dom/client";
import setupStore from '../setupStore.ts'
import App from "./App.tsx";
import "./index.css";
import { Provider } from "react-redux";
import React from "react";

const store = setupStore()

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
