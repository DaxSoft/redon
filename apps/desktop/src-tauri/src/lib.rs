use serde_json::Value;

#[tauri::command]
async fn healthcheck() -> Result<&'static str, String> {
    Ok("ok")
}

#[tauri::command]
async fn invoke_sidecar(command: String, payload: Value) -> Result<Value, String> {
    let client = reqwest::Client::new();
    let url = format!("http://127.0.0.1:1421/ipc/{}", command);

    let res = client
        .post(&url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        let json: Value = res.json().await.map_err(|e| e.to_string())?;
        Ok(json)
    } else {
        let err_text = res.text().await.unwrap_or_default();
        Err(format!("Sidecar error: {}", err_text))
    }
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![healthcheck, invoke_sidecar])
        .run(tauri::generate_context!())
        .expect("failed to run Redon");
}
