import React, { useContext, useState } from "react";
import axios from "axios";
import { AuthContext } from "../Context/AuthProvider";
// import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Row, Col, message, Alert } from "antd";

const Login = () => {
  const { setUser, setToken, setIsAuth, setRole } = useContext(AuthContext);
  // const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/auth/login/",
        formData
      );
      const { access } = response.data;
      const tokenPayload = JSON.parse(atob(access.split(".")[1]));
      setUser(tokenPayload);
      setToken(access);
      setIsAuth(true);
      setRole(tokenPayload.role);
    
      localStorage.setItem("authTokens", access);
      localStorage.setItem("userDetails", JSON.stringify(tokenPayload));
      localStorage.setItem("userId", tokenPayload.user_id);

      window.location.replace("/");

      if (tokenPayload.role === "Admin") {
        message.success("You are logged in as Admin!");
      } else {
        message.success("You are logged in as User!");
      }
      // navigate("/", { replace: true });
    } catch (error) {
      setErrorMessage("Wrong username or password. Please try again.");
      console.error("Error during login:", error);
    }
  };

  return (
    <div style={{ marginTop: "100px"  }} onLoad="noBack();" onpageshow="if (event.persisted) noBack();" onUnload="">
      <Row justify="center" style={{ marginTop: "20px" }}>
        <Col xs={24} sm={18} md={12} lg={8}>
          <Card style={{ backgroundColor: "whitesmoke", border:"1px solid"}}>
            <Form layout="vertical" onFinish={handleSubmit} className="my-4">
              <h3>Login</h3>
              {errorMessage && (
                <Alert
                  message={errorMessage}
                  type="error"
                  showIcon
                  style={{ marginBottom: "20px" }}
                />
              )}
              <Form.Item label="Username" required>
                <Input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </Form.Item>
              <Form.Item label="Password" required>
                <Input.Password
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </Form.Item>
              <div style={{ color: "black" }}>Don't have an account?  <a href="/register">Register!</a></div>{" "}     
              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Login
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Login;
