import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
import MenuFloatingPage from "./MenuFloatingPage";
export default function TestingPage() {
    const navigate = useNavigate();
    const menuRef = useRef();
    const [shade, setShade] = useState(false);

    useEffect(() => {
        menuRef.current = document.getElementById("menu-floating-page");
    }, []);

    async function testCheckEmail() {
        invoke("check_email", { email: "ein@gmail.com" })
            .then((res) => {
                console.log(res);
            })
            .catch((e) => {
                console.log(`Error: ${e}`);
            });
    }

    const moveMenu = () => {
        menuRef.current.classList.toggle("move-menu");
        setShade((old) => !old);
    };

    const closeShade = () => {
        setShade((old) => !old);
        menuRef.current.classList.toggle("move-menu");
    };

    return (
        <div>
            {shade ? (
                <div onClick={closeShade} className="shade-div"></div>
            ) : null}
            <button
                onClick={() => {
                    navigate("/login");
                }}
            >
                Login
            </button>
            <button onClick={testCheckEmail}>test check email</button>
            <button>floating menu</button>
            <button onClick={moveMenu}>trans</button>
            <MenuFloatingPage />
        </div>
    );
}
