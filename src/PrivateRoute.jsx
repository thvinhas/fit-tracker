import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("authToken");
};

export default PrivateRoute;
