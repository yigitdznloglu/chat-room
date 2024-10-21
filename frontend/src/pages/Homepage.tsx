import React from "react";
import { Navbar, Nav } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { IoEnterOutline } from "react-icons/io5";
import "./Homepage.css";
import logo from "./images/logo.png";

export default function Homepage() {
    const navigate = useNavigate();

    const handleLogoClick = () => {
        navigate('/');
    };

    return (
        <div id="homepage">
            <Navbar bg="transparent" variant="light" expand="lg" fixed="top" className="navbar" id="my-navbar">
                <Navbar.Brand onClick={handleLogoClick}>
                    <img src={logo} alt="Logo" className="logo" style={{ cursor: 'pointer' }} />
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="ml-auto">
                        <Nav.Link onClick={() => navigate('/login')} className="nav-icon">
                            <IoEnterOutline size={30} />
                        </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
            <div className="welcome-text">
                <h1>welcome to <span>chat room</span></h1>
            </div>
        </div>
    );
}
