import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../configuration";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router";

const SingUp = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    await createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        localStorage.setItem("authToken", user.accessToken);
        navigate("/");
        // navigate("/login");
        // ...
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
        // ..
      });
  };
  return (
    <main>
      <div>
        <div>
          <h1> FocusApp </h1>
          <form>
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

            <button type="submit" onClick={onSubmit}>
              Sign up
            </button>
          </form>

          <p>
            Already have an account? <NavLink to="/login">Sign in</NavLink>
          </p>
        </div>
      </div>
    </main>
  );
};
export default SingUp;
