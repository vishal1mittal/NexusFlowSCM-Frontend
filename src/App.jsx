import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Signup from "./components/signup/SignUp";
import Signin from "./components/signin/SignIn"; // Import your login component here
import Home from "./components/home/Home"; // Optional, if you want a home page
import "./App.css";

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<Home />} /> {/*Home page*/}
                    <Route path="/signup" element={<Signup />} />{" "}
                    {/* Signup page */}
                    <Route path="/signin" element={<Signin />} />{" "}
                    {/* Login page */}
                </Routes>
            </div>
        </Router>
    );
}

export default App;
