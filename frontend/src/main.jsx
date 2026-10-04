import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "./redux/store.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <Provider store={store}>
            <AuthProvider>
                <ToastProvider>
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                </ToastProvider>
            </AuthProvider>
        </Provider>
    </StrictMode>
);
