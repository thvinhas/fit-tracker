import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { auth } from "../configuration";
import { Navigate, NavLink, useNavigate } from "react-router";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const onLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        localStorage.setItem("authToken", user.accessToken);
        navigate("/");
        console.log(user);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
      });
  };

  return (
    <main>
      <div>
        <div>
          <h1> FocusApp </h1>
          <form onSubmit={onLogin}>
            <div>
              <label htmlFor="email-address">Email address</label>
              <input
                type="email"
                label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email address"
              />
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                label="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
              />
            </div>
            <button type="submit">login</button>
          </form>

          <p>
            Don't have an account? <NavLink to="/singUp">Sign up</NavLink>
          </p>
        </div>
      </div>
    </main>
  );
};
export default Login;
