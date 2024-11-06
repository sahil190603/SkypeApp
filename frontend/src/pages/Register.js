import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Row, Col, message, Space } from "antd";
import { avatarData } from "../constant";
import "../Style/Register.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    contact_no: "",
    first_name: "",
    last_name: "",
    avatar: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarSelect = (value) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      avatar: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      await axios.post("http://localhost:8000/auth/Users/", formData);
      message.success("Registration Successful");
      navigate("/login");
    } catch (error) {
      console.error("There was an error!", error);
      message.error("Registration Failed");
    }
  };

  return (
    <Row justify="center" style={{ marginTop: "20px" }}>
      <Col xs={24} sm={18} md={12} lg={8}>
        <Card style={{ backgroundColor: "whitesmoke" }}>
          <Form layout="vertical" onFinish={handleSubmit}>
            <h3 className="text-center">Registration Form</h3>
            <Form.Item label="Username" required>
              <Input
                type="text"
                name="username"
                placeholder="Username"
                onChange={handleChange}
                value={formData.username}
              />
            </Form.Item>
            <Form.Item label="Email" required>
              <Input
                type="email"
                name="email"
                placeholder="Email"
                onChange={handleChange}
                value={formData.email}
              />
            </Form.Item>
            <Form.Item label="Password" required>
              <Input.Password
                name="password"
                placeholder="Password"
                onChange={handleChange}
                value={formData.password}
              />
            </Form.Item>

            <Form.Item label="Contact" required>
              <Input
                type="text"
                name="contact_no"
                placeholder="Contact Number"
                onChange={handleChange}
                value={formData.contact_no}
              />
            </Form.Item>
            <Form.Item label="First Name" required>
              <Input
                type="text"
                name="first_name"
                placeholder="First Name"
                onChange={handleChange}
                value={formData.first_name}
              />
            </Form.Item>
            <Form.Item label="Last Name" required>
              <Input
                type="text"
                name="last_name"
                placeholder="Last Name"
                onChange={handleChange}
                value={formData.last_name}
              />
            </Form.Item>
            <div className="avatar-selection">
              <div className="avatar-selection-label">Choose Avatar Color:</div>
              <Space size="small" wrap  required>
                {avatarData.map((avatar) => (
                  <div
                    key={avatar.id}
                    className={`avatar-circle ${
                      formData.avatar === avatar.value ? "selected" : ""
                    }`}
                    style={{ backgroundColor: avatar.Hex }}
                    onClick={() => handleAvatarSelect(avatar.value)}
                  />
                ))}
              </Space>
            </div>

            <a style={{ color: "black" }}>Already have an account?</a>
            <a href="/login"> sign in!</a>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Register
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default Register;
