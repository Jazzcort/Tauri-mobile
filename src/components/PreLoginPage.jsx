import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
export default function PreLoginPage() {
    const navigate = useNavigate()
    useEffect(() => {
        async function login_with_user_file() {
            invoke("login_with_user_file")
                .then((res) => {
                    if (res.logged_in) {
                        navigate("/home");
                    } else {
                        navigate("/login");
                    }
                })
                .catch((e) => {
                    navigate("/login");
                });
        }
        login_with_user_file();
    }, []);

    return <div></div>;
}
