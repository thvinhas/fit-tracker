import { BrowserRouter as Router } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import Database from "./Database";
import Login from "./Auth/Login";
import PrivateRoute from "./PrivateRoute";
import SingUp from "./Auth/SingUp";

function App() {
  return (
    <Router>
      <div>
        <section>
          <Routes>
            <Route path="/login" element={<Login />}></Route>
            <Route path="/singUp" element={<SingUp />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Database />
                </PrivateRoute>
              }
            />
          </Routes>
        </section>
      </div>
    </Router>
  );
}

export default App;
