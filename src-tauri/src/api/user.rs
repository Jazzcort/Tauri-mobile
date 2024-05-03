use crate::json;
use chrono::prelude::*;
use serde::{Deserialize, Serialize};
use tauri_plugin_http::reqwest::Response;
use std::fs::File;
use std::io::Read;
use std::path::PathBuf;
use std::sync::Mutex;
use std::{collections::HashMap, hash::Hash, sync::Arc};
use tauri::{Manager, State};
use tauri_plugin_http::reqwest::{
    self,
    cookie::{self, Cookie},
    Client,
};
use tauri::async_runtime::spawn;
use sha2::{Digest, Sha256};

use uuid::Uuid;

use crate::{http_client::HttpClient, DEV_URL};

#[derive(Serialize, Clone, Deserialize)]
pub(crate) struct AuthState {
    #[serde(skip_serializing)]
    token: Option<String>,
    #[serde(skip_serializing)]
    expiration_date: Option<i64>,
    logged_in: bool,
}

impl Default for AuthState {
    fn default() -> Self {
        Self {
            token: None,
            expiration_date: None,
            logged_in: false,
        }
    }
}

#[derive(Deserialize)]
pub(crate) struct UserInfo {
    email: String,
    password: String,
}

#[derive(Deserialize)]
pub(crate) struct LoginSession {
    session_id: String,
    expiration_date: i64,
}

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("the mutex was poisoned")]
    PoisonError(String),
    #[error("tauri error")]
    TauriError(#[from] tauri::Error),
    #[error("reqwest error")]
    ReqwestError(#[from] reqwest::Error),
    #[error("already logged out")]
    AlreadyLoggedOutError,
    #[error("something went wrong at the server side")]
    ServerError
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

impl<T> From<std::sync::PoisonError<T>> for Error {
    fn from(err: std::sync::PoisonError<T>) -> Self {
        Error::PoisonError(err.to_string())
    }
}

#[tauri::command]
pub(crate) async fn login_with_password(
    email: String,
    password: String,
    app_handle: tauri::AppHandle,
    auth_state: State<'_, Mutex<AuthState>>,
) -> Result<AuthState, Error> {
    let binding = app_handle.path().app_data_dir()?;

    match login_with_password_helper(&email, &password).await {
        Ok(session) => {
            let file_path = PathBuf::from(&binding).join(".user.json");
            if session.logged_in {
                let data = json!({
                    "email": email,
                    "password": password
                });
                let _ = std::fs::write(&file_path, data.to_string());

                let mut auth_state_handle = auth_state.lock()?;
                *auth_state_handle = session.clone();
                update_auth_state(app_handle, session.clone());

                let session_file_path = PathBuf::from(binding).join(".session.json");
                let session_json = json!({
                    "token": session.token.clone(),
                    "expiration_date": session.expiration_date,
                    "logged_in": true

                });
                let _ = std::fs::write(session_file_path, session_json.to_string());
            }
            Ok(session)
        }
        Err(e) => Err(e),
    }
}

// #[tauri::command]
// pub(crate) async fn login_with_session(
//     cookie_store_mut: State<'_, Arc<CookieStoreMutex>>,
// ) -> Result<String, Error> {
//     let client = reqwest::Client::builder()
//         .cookie_provider(Arc::clone(&cookie_store_mut))
//         .build()
//         .unwrap();

//     let res = client
//         .post(format!("{}/user/loginSession", DEV_URL))
//         .send()
//         .await
//         .unwrap();

//     dbg!(res.status());

//     Ok("login_with_session".to_string())
// }

#[tauri::command]
pub(crate) async fn login_with_user_file(
    app_handle: tauri::AppHandle,
    auth_state: State<'_, Mutex<AuthState>>,
) -> Result<AuthState, Error> {
    let binding = app_handle.path().app_data_dir()?;
    let file_path = PathBuf::from(&binding).join(".user.json");

    match File::open(&file_path).and_then(|mut file| {
        let mut json_str = String::new();

        file.read_to_string(&mut json_str)?;
        if !json_str.is_empty() {
            let user_info: UserInfo = serde_json::from_str::<UserInfo>(&json_str)?;
            Ok(user_info)
        } else {
            Err(std::io::Error::new(std::io::ErrorKind::Other, "empty file"))
        }
    }) {
        Ok(user) => login_with_password_helper(&user.email, &user.password)
            .await
            .and_then(|session| {
                if session.logged_in {
                    let mut auth_state_handle = auth_state.lock()?;
                    *auth_state_handle = session.clone();
                    update_auth_state(app_handle, session.clone());

                    let session_file_path = PathBuf::from(binding).join(".session.json");
                    let session_json = json!({
                        "token": session.token.clone(),
                        "expiration_date": session.expiration_date,
                        "logged_in": true

                    });
                    let _ = std::fs::write(session_file_path, session_json.to_string());
                }
                Ok(session)
            }),
        Err(e) => {
            let _ = std::fs::write(&file_path, "");
            Err(Error::Io(e))
        }
    }
}

#[tauri::command]
pub(crate) async fn signup(username: String, password: String, email:String) -> Result<(), Error> {
    let salt = Uuid::new_v4().to_string();
    let mut hasher = Sha256::new();
    hasher.update(password);
    let hashed_password = format!("{:x}",hasher.finalize_reset());

    hasher.update(hashed_password + &salt);
    let hash = format!("{:x}",hasher.finalize());

    let mut json = HashMap::new();
    json.insert("email".to_string(), email);
    json.insert("username".to_string(), username);
    json.insert("salt".to_string(), salt);
    json.insert("hash".to_string(), hash);


    let client = reqwest::Client::new();
    
    let res = client.post(format!("{}/user/create", DEV_URL)).json(&json).send().await?;

    match res.status().as_u16() {
        200 => {
            Ok(())
        }
        _ => {
            Err(Error::ServerError)
        }
    } 
       
}

#[tauri::command]
pub(crate) fn check_login_state(auth_state: State<'_, Mutex<AuthState>>) -> Result<bool, Error> {
    let auth_state_handle = auth_state.lock()?;
    Ok(auth_state_handle.logged_in)
}

#[tauri::command]
fn check_session(auth_state: State<'_, Mutex<AuthState>>) -> Result<bool, Error> {
    let auth_state_handle = auth_state.lock()?;

    if !auth_state_handle.logged_in {
        return Ok(false);
    }

    match (
        auth_state_handle.token.clone(),
        auth_state_handle.expiration_date.clone(),
    ) {
        (Some(_), Some(expiration_date)) => Ok(check_expiration(expiration_date)),
        _ => Ok(false),
    }
}

fn check_expiration(expiration_date: i64) -> bool {
    let cur_time = Utc::now().timestamp();

    if cur_time + 30 <= expiration_date {
        true
    } else {
        false
    }
}

#[tauri::command]
pub(crate) async fn check_email(email: String) -> Result<bool, Error> {
    let client = reqwest::Client::new();
    let res = client.get(format!("{}/user/emailCheck/{}", DEV_URL, email)).send().await?;
    let body = res.text().await?;
    dbg!(body);

    Ok(true)
}

// fn write_to_file(path: &PathBuf, data: String) -> Result<(), Error> {
//     Ok(std::fs::write(path, data)?)
// }

// fn read_from_file(path: &PathBuf) -> Result<String, Error> {
//     let mut res = String::new();

// }

#[tauri::command]
pub(crate) async fn logout(app_handle: tauri::AppHandle) -> Result<(), Error> {
    let copy_app_handle = app_handle.clone();

    let auth_state = app_handle.state::<Mutex<AuthState>>();
    let mut auth_state_handle = auth_state.lock()?;

    if !auth_state_handle.logged_in {
        return Err(Error::AlreadyLoggedOutError);
    }

    let binding = app_handle.path().app_data_dir()?;
    let user_file_path = PathBuf::from(&binding).join(".user.json");
    let session_file_path = PathBuf::from(binding).join(".session.json");


    if let Some(id) = &auth_state_handle.token {
        let copy_id = id.to_string();
        spawn(async move {
            let _ = delete_session(copy_id).await;
        });
    }

    
    *auth_state_handle = AuthState::default();
    update_auth_state(copy_app_handle, AuthState::default());
    let _ = std::fs::write(user_file_path, "");
    let _ = std::fs::write(session_file_path, "");

    Ok(())
}

async fn delete_session(session_id: String) -> Result<Response, Error> {
    let client = reqwest::Client::new();
    let mut json = HashMap::new();
    json.insert("session_id".to_string(), session_id.to_string());

    Ok(client.delete(format!("{}/user/delete", DEV_URL)).json(&json).send().await?)

}


fn update_auth_state(app_handle: tauri::AppHandle, new_state: AuthState) {
    let _ = app_handle.emit("login-state", new_state);
}

async fn login_with_password_helper(email: &str, password: &str) -> Result<AuthState, Error> {
    let client = reqwest::Client::new();

    let mut json = HashMap::new();
    json.insert("email".to_string(), email.to_string());
    json.insert("password".to_string(), password.to_string());

    let res = client
        .post(format!("{}/user/loginPassword", DEV_URL))
        .json(&json)
        .send()
        .await?;

    match res.status().as_u16() {
        200 => {
            let session = res.json::<LoginSession>().await?;
            Ok(AuthState {
                token: Some(session.session_id),
                expiration_date: Some(session.expiration_date),
                logged_in: true,
            })
        }
        _ => Ok(AuthState {
            token: None,
            expiration_date: None,
            logged_in: false,
        }),
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test1() {
        // dbg!(check_email("erin@gmail.com".to_string()).await)
    }

}
