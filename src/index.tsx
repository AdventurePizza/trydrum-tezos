import "./index.css";

import App from "./App";
import { FirebaseProvider } from "./firebaseContext";
import React from "react";
import ReactDOM from "react-dom";
import { SnackbarProvider } from "notistack";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from "./Analytics";

ReactDOM.render(
  <BrowserRouter>
    <FirebaseProvider>
      <SnackbarProvider maxSnack={3}>
        <Routes>
          <Route path="/Analystics" element={<Analytics />}>
          </Route>
          <Route path='/' element={<App />}>
          </Route>

        </Routes>
      </SnackbarProvider>
    </FirebaseProvider>
  </BrowserRouter>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
