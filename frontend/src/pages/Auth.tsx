import React, { useState } from "react";
import { Navbar, Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
import logo from "./images/logo.png";

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const toggleForm = () => {
        setIsLogin(!isLogin);
        setError("");
    };

    const handleLogoClick = () => {
        navigate('/');
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        const endpoint = isLogin ? "/api/users/login" : "/api/users/register";
        const payload = { username, password };

        try {
            const response = await fetch(`http://localhost:3009${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Something went wrong");
            }

            if (isLogin) {
                navigate("/dashboard");
            } else {
                setIsLogin(true);
                setError("Registration successful. Please log in.");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div id="homepage">
            <Navbar bg="transparent" variant="light" expand="lg" fixed="top" className="navbar" id="my-navbar">
                <Navbar.Brand onClick={handleLogoClick}>
                    <img src={logo} alt="Logo" className="logo" style={{ cursor: 'pointer' }} />
                </Navbar.Brand>
            </Navbar>
            <div className="auth-form">
                <img src={logo} alt="Logo" className="logo" />
                <Form onSubmit={handleSubmit}>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form.Group controlId="formBasicEmail" className="form-group">
                        <Form.Control
                            type="text"
                            placeholder="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Form.Group controlId="formBasicPassword" className="form-group">
                        <Form.Control
                            type="password"
                            placeholder="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </Form.Group>
                    
                    <Button variant="primary" type="submit" className="submit-btn" disabled={loading}>
                        {loading ? "Loading..." : isLogin ? "Login" : "Sign Up"}
                    </Button>
                </Form>
                <div className="toggle-text">
                    {isLogin ? (
                        <p>Don't have an account? <span onClick={toggleForm} className="toggle-link">Sign up</span></p>
                    ) : (
                        <p>Already have an account? <span onClick={toggleForm} className="toggle-link">Login</span></p>
                    )}
                </div>
            </div>
        </div>
    );
}
