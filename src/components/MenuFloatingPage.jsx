import "../styles/MenuFloatingPage.css"
import { useRef } from "react";
export default function MenuFloatingPage() {
    const menuRef = useRef();

    return (
        <div ref={menuRef.current} id="menu-floating-page">
            <div id="menu-page-logo">
                <img width={"50px"} src="./tauri.svg" alt="" />
                <p>Tauri App</p>
            </div>
            <button className="menu-item">Records</button>
            <button className="menu-item">Coming Interviews</button>
            <button className="menu-item">Offers</button>
        </div>
    );
}
