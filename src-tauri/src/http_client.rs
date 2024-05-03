use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri_plugin_http::reqwest;
pub struct HttpClient {
    pub client: Mutex<reqwest::Client>
}

#[derive(Deserialize, Serialize, Debug)]
pub struct ClientCookie {
    pub detail: String
}

#[derive(Deserialize, Serialize, Debug)]
pub struct CookieJSON {
    pub cookies: Vec<ClientCookie>
}