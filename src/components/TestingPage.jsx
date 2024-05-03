import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
export default function TestingPage() {
    const navigate = useNavigate();

    async function testCheckEmail() {
        invoke("check_email", {email: "ern@gmail.com"}).then(res => {
            console.log(res);
        }).catch(e => {
            console.log(`Error: ${e}`);
        })
    
    }
    return (
        <div>
            <button onClick={() => {navigate("/login")}}>Login</button>
            <button onClick={testCheckEmail}>test check email</button>
        </div>
    )
}