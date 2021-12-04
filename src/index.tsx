import "./index.css";

import App from "./App";
import { FirebaseProvider } from "./firebaseContext";
import React from "react";
import ReactDOM from "react-dom";
import { SnackbarProvider } from "notistack";
import reportWebVitals from "./reportWebVitals";

ReactDOM.render(
  <FirebaseProvider>
    <SnackbarProvider maxSnack={3}>
      <App />
    </SnackbarProvider>
  </FirebaseProvider>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
