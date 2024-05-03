import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import Home from "./components/Home";
import LonginPage from "./components/LoginPage";
import PreLoginPage from "./components/PreLoginPage";

import {
    createBrowserRouter,
    RouterProvider,
    Route,
    Link,
} from "react-router-dom";
import TestingPage from "./components/TestingPage";

const router = createBrowserRouter([
    {
        path: "/",
        element: <PreLoginPage />,
    },
    {
        path: "/login",
        element: <LonginPage />
    },
    {
        path: "/home",
        element: <Home />,
    },
    {
        path: "/app",
        element: <App />,
    },
    {
        path: "/testing",
        element: <TestingPage />
    }
]);

ReactDOM.createRoot(document.getElementById("root")).render(
    <RouterProvider router={router} />
);
