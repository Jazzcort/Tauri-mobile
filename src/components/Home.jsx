import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listen } from "@tauri-apps/api/event";
import { Store } from "@tauri-apps/plugin-store";
import { invoke } from "@tauri-apps/api/core";

export default function Home() {
    const navigate = useNavigate();
    const [text, setText] = useState();
    const store = new Store("store.bin");
    const [appData, setAppData] = useState("");
    const [inputText, setInputText] = useState("");
    const [status, setStatus] = useState(false);

    useEffect(() => {
        let unlistenPromise = listen("some", (ev) => {
            setText(JSON.stringify(ev.id) + JSON.stringify(ev.payload));
        });

        let unlistenStatePromise = listen("login-state", (ev) => {
            // console.log(ev.payload);
            setStatus(ev.payload.logged_in);
        })
        window.history.pushState(null, document.title, window.location.href);
        const popState = new AbortController();
        window.addEventListener(
            "popstate",
            function (event) {
                window.history.pushState(
                    null,
                    document.title,
                    window.location.href
                );
            },
            { signal: popState.signal }
        );

        async function check_login_state() {
            invoke("check_login_state").then(res => {
                setStatus(res);
            }).catch(e => {})

        }

        check_login_state()

        return () => {
            popState.abort();
            unlistenPromise.then((unlisten) => {
                unlisten();
            });
            unlistenStatePromise.then((unlisten) => {
                unlisten();
            })
        };
    }, []);

    function navigateToApp() {
        navigate("/app");
    }

    // function navigateToLogin() {
    //     navigate("/login");
    // }

    async function updateValue() {
        let val = await store.get("curValue");
        val = val ? val : 0;

        await store.set("curValue", val + 1);
        store.save();
    }

    async function readValue() {
        setText(await store.get("curValue"));
    }

    async function readAppData() {
        let data = await invoke("read_data_from_app_data");
        setAppData(data);
    }

    async function storeAppData() {
        await invoke("store_data_in_app_date", { data: inputText });
    }

    async function getHttpResponse() {
        console.log(await invoke("get_http_response", {url: "https://www.google.com"}));
    }

    async function handleLogOut() {
        invoke("logout").then(res => {
            
        }).catch(e => {
            alert("You are alreadt logged out")    
        })
    }


    return (
        <div>
            <h1>Home Page</h1>
            <p>{text}</p>
            <button onClick={navigateToApp}>To App</button>
            {/* <button onClick={navigateToLogin}>To Login</button> */}
            <button onClick={updateValue}>update value</button>
            <button onClick={readValue}>read value</button>
            <input
                onChange={(e) => {
                    setInputText(e.target.value);
                }}
                value={inputText}
            ></input>
            <button onClick={readAppData}>read app data</button>
            <button onClick={storeAppData}>store app data</button>
            <p>app data: {appData}</p>
            <button onClick={getHttpResponse}>get http response</button>
            <p>{status ? "logged in" : "not logged in"}</p>
            <button onClick={handleLogOut}>Log out</button>
        </div>
    );
}
