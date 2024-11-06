import React, { useContext, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import AppButton from "../components/Generic/AppButton";
import PrivateRoute from "./PrivetRoute";
import { Result } from "antd";
import { AuthContext } from "../Context/AuthProvider";
import { useNavigate } from "react-router-dom";
import Skype from "../pages/Skype";

const MainRoute = () => {
  const { role, user } = useContext(AuthContext) ?? {};
  const navigate = useNavigate();
  const location = useLocation();


  useEffect(() => {
    if ((location.pathname === "/login" || location.pathname === "/register") && user) {
      navigate("/", { replace: true });
    }
  }, [location.pathname, user, navigate]);

  return (
    <div>
      <Routes>
        <Route path="/login" element={!user && <Login />} />
        <Route path="/register" element={!user && <Register />} />

        {role === "User" && (
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Skype />
              </PrivateRoute>
            }
          />
        )}
        <Route
          path="/unauthorized"
          element={
            <Result
              status="403"
              title="403"
              subTitle="Sorry, you are not authorized to access this page."
              extra={
                <AppButton
                  type="dashed"
                  onClick={() => navigate("/")}
                  label="Back Home"
                />
              }
            />
          }
        />
      </Routes>
    </div>
  );
};

export default MainRoute;
