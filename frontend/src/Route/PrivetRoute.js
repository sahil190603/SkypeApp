import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../Context/AuthProvider";
import { setUserSelected } from "../Redux/feature/feature";
import { useDispatch } from "react-redux";

const PrivateRoute = ({ children, allowedRoles }) => {
  const dispatch = useDispatch();
  const { isAuth, role } = useContext(AuthContext);

  if (!isAuth) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/login" />;
  }
  dispatch(setUserSelected(null));

  return children ? children : <Outlet />;
};

export default PrivateRoute;
