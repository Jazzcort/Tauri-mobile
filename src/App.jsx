import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import Button from "@mui/material/Button";
import SendIcon from "@mui/icons-material/Send";
import { useNavigate } from "react-router-dom";

import "./App.css";

function App() {
    const [greetMsg, setGreetMsg] = useState("");
    const [handleTime, setHandleTime] = useState(0);
    function msgHandler(msg) {
        setHandleTime((prev) => prev + 1);
        console.log(msg);
    }
    const [name, setName] = useState("");
    const [text, setText] = useState("");
    const navigate = useNavigate();
    const popState = useRef(new AbortController());

    useEffect(() => {
        let unlistenPromise = listen("some", (ev) => {
            setText(JSON.stringify(ev.id) + JSON.stringify(ev.payload));
            msgHandler(ev.payload);
        });

        window.history.pushState(null, document.title, window.location.href);
        window.addEventListener("popstate", function (event) {
            window.history.pushState(
                null,
                document.title,
                window.location.href
            );
        }, {signal: popState.current.signal});

        console.log("init");

        return () => {
            unlistenPromise.then((unlisten) => {
                unlisten();
            });
            popState.current.abort();
        };
    }, []);

    async function greet() {
        // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
        setGreetMsg(await invoke("greet", { name }));
    }

    async function listenEvent() {
        invoke("some_event");
    }

    return (
        <div className="container">
            <h1>Welcome to Tauri!</h1>
            <p>Hahaha</p>

            <p>Click on the Tauri, Vite, and React logos to learn more.</p>

            <form
                className="row"
                onSubmit={(e) => {
                    e.preventDefault();
                    greet();
                }}
            >
                <input
                    id="greet-input"
                    onChange={(e) => setName(e.currentTarget.value)}
                    placeholder="Enter a name..."
                />
                <button type="submit">Greet</button>
            </form>

            <br></br>
            <button onClick={listenEvent}>event</button>
            <p>{text}</p>
            <p>{handleTime}</p>

            <button
                onClick={() => {
                    navigate("/home");
                }}
            >
                Back to Home
            </button>
            <p>{greetMsg}</p>
            <Button variant="contained" endIcon={<SendIcon />}>
                Send
            </Button>
        </div>
    );
}

export default App;
