import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import "../styles/PreLoginPage.css"
export default function PreLoginPage() {
    const navigate = useNavigate();
    useEffect(() => {
        async function login_with_user_file() {
            try {
                const res = await invoke("login_with_session");
                if (res) {
                    // console.log("login with session!!!");
                    return navigate("/home");
                }
                // console.log("session expires")
            } catch (e) {
                // console.log("no session file or server down")
            }

            try {
                const res = await invoke("login_with_user_file");
                if (res.logged_in) {
                    // console.log("login with user file!!!");
                    return navigate("/home");
                } else {
                    // console.log("failed to login with user file")
                    return navigate("/login");
                }
            } catch (e) {
                // console.log("no user file")

                return navigate("/login");
            }

        }
        login_with_user_file();
    }, []);

    return <div className="pre-login"></div>;
}
