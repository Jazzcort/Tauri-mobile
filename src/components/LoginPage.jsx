import "../styles/LoginPage.css";
import { useRef, useState, useEffect } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useNavigate, useFetcher } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";

export default function LonginPage() {
    const height = window.innerHeight;
    const width = window.innerWidth;
    const navigate = useNavigate();
    const fetcher = useFetcher();
    const [errorMsg, setErrorMsg] = useState("")
    const [loginData, setLoginData] = useState({
        email: "",
        password: "",
    });

    

    function handleEmail(e) {
        setLoginData(old => ({...old, email: e.target.value}))
    }

    function handlePassword(e) {
        setLoginData(old => ({...old, password: e.target.value}))
    }

    async function handleLogin() {
        invoke("login_with_password", {email: loginData.email, password: loginData.password}).then(res => {
            if (res.logged_in) {
                navigate("/home");
            } else {
                setErrorMsg("Email doesn't exist or wrong password")
            }
        }).catch(e => {
            if (e === "reqwest error") {
                setErrorMsg("Servers are down")
            } else {
                console.log(e)
                setErrorMsg("App data error")
            }
        })
    }

    async function handleLoginWithSession() {
        
    }


    return (
        <div className="login-grid">
            <div className="login-offset"></div>
            <div className="login-main">
                <div className="text-field-input">
                    <input onChange={handleEmail} value={loginData.email} type="email" id="email" placeholder="Email" />
                    <input onChange={handlePassword} value={loginData.password} type="password" placeholder="Password" />
                    <p>{errorMsg}</p>
                </div>
                <Stack spacing={1} direction="column">
                    <Button onClick={handleLogin} variant="contained">Login</Button>
                    <Button onClick={handleLoginWithSession} variant="contained">Login with session</Button>
                    <Button variant="contained">Sign up</Button>
                    <Button onClick={() => {navigate("/testing")}} variant="contained">Testing</Button>
                </Stack>
                <p>{height}</p>
                <p>{width}</p>
            </div>
        </div>
    );
}
