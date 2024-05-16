// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
mod api;
mod http_client;
use api::user::*;
use http_client::{CookieJSON, HttpClient};
use rand::prelude::*;
use serde_json::json;
use std::{
    fs::{create_dir, write, File},
    io::{Error, Read, ErrorKind},
    path::PathBuf,
    sync::{Arc, Mutex},
};
// use tauri::async_runtime::Mutex;
use tauri::State;
use tauri::{App, Manager};
use tauri_plugin_http::reqwest::{self, cookie::Cookie};

const DEV_URL: &str = "http://192.168.1.153:20130";

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn some_event(window: tauri::Window, app: tauri::AppHandle) {
    let mut arr = vec!["haha", "I'm", "Tao"];
    let mut rng = rand::thread_rng();

    arr.shuffle(&mut rng);

    window.emit("some", app.path().app_data_dir().unwrap());
}

#[tauri::command]
fn store_data_in_app_date(app_handle: tauri::AppHandle, data: String) {
    let binding = app_handle.path().app_data_dir().unwrap();
    let file_path = PathBuf::from(binding).join("text.txt");
    let _ = std::fs::write(&file_path, data);
}
#[tauri::command]
fn read_data_from_app_data(app_handle: tauri::AppHandle) -> String {
    let binding = app_handle.path().app_data_dir().unwrap();
    let file_path = PathBuf::from(binding).join("text.txt");
    match File::open(&file_path).and_then(|mut file| {
        let mut data = String::new();
        file.read_to_string(&mut data)?;
        return Ok(data);
    }) {
        Ok(data) => data,
        Err(_) => "could not read the file".to_string(),
    }
}

#[tauri::command]
async fn get_http_response(url: String) -> String {
    match reqwest::get(url).await {
        Ok(res) => {
            let a = res.status();
            dbg!(a);
            let text = res.text().await;
            dbg!(text);
            a.to_string()
        }
        Err(_) => "Error".to_string(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .manage(Mutex::new(AuthState::default()))
        .invoke_handler(tauri::generate_handler![
            greet,
            some_event,
            read_data_from_app_data,
            store_data_in_app_date,
            get_http_response,
            login_with_password,
            login_with_session,
            login_with_user_file,
            logout,
            check_login_state,
            check_email,
            check_username,
            signup
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
