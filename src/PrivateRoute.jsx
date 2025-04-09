import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const PrivateRoute = ({ children }) => {
  const { user, Loading } = useAuth();

  if (Loading) return <p>loading...</p>;

  return user ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
