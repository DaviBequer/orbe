// Orbe para Windows: uma janela que abre o site publicado (as atualizações do site chegam sozinhas)
// e uma janelinha do cronômetro sem bordas, sempre por cima de tudo.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{AppHandle, LogicalSize, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};

const SITE: &str = "https://davibequer.github.io/orbe/";
const TIMER_W: f64 = 290.0;

fn shell_script() -> String {
    let v = option_env!("ORBE_SHELL_V").unwrap_or("1");
    format!("window.ORBE_SHELL = {{ plat: 'windows', v: {} }};", v.trim())
}

/// Abre (ou ajusta) a janelinha do cronômetro no canto inferior direito da tela.
#[tauri::command]
fn open_timer(app: AppHandle, height: f64) -> Result<(), String> {
    let h = height.clamp(40.0, 400.0);
    if let Some(w) = app.get_webview_window("timer") {
        let _ = w.set_size(LogicalSize::new(TIMER_W, h));
        let _ = w.show();
        return Ok(());
    }
    let url = format!("{SITE}timer.html").parse().map_err(|e| format!("{e}"))?;
    let mut b = WebviewWindowBuilder::new(&app, "timer", WebviewUrl::External(url))
        .title("Orbe · fazendo agora")
        .inner_size(TIMER_W, h)
        .resizable(false)
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .shadow(true)
        .focused(false)
        .initialization_script(&shell_script());
    if let Some(main) = app.get_webview_window("main") {
        if let Ok(Some(m)) = main.primary_monitor() {
            let sf = m.scale_factor();
            let size = m.size().to_logical::<f64>(sf);
            let pos = m.position().to_logical::<f64>(sf);
            b = b.position(pos.x + size.width - TIMER_W - 20.0, pos.y + size.height - h - 64.0);
        }
    }
    b.build().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn close_timer(app: AppHandle) {
    if let Some(w) = app.get_webview_window("timer") {
        let _ = w.close();
    }
}

/// Baixa o instalador novo (do GitHub do Orbe), abre e fecha o app para ele poder instalar por cima.
#[tauri::command]
fn update_app(app: AppHandle, url: String) -> Result<(), String> {
    if !url.starts_with("https://github.com/DaviBequer/orbe/releases/") || url.contains('\'') || url.contains('"') {
        return Err("endereço inválido".into());
    }
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        let ps = format!(
            "$f = Join-Path $env:TEMP 'Orbe-instalador.exe'; Invoke-WebRequest -UseBasicParsing -Uri '{url}' -OutFile $f; Start-Process $f"
        );
        std::process::Command::new("powershell")
            .args(["-NoProfile", "-WindowStyle", "Hidden", "-Command", &ps])
            .creation_flags(0x08000000) // sem janela preta
            .spawn()
            .map_err(|e| e.to_string())?;
        app.exit(0);
    }
    #[cfg(not(windows))]
    {
        let _ = app;
    }
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_timer, close_timer, update_app])
        .setup(|app| {
            let url = SITE.parse().expect("endereço do site");
            WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url))
                .title("Orbe")
                .inner_size(1280.0, 820.0)
                .min_inner_size(380.0, 560.0)
                .center()
                .initialization_script(&shell_script())
                .build()?;
            Ok(())
        })
        .on_window_event(|w, e| {
            // fechou a janela principal: fecha o app inteiro (inclusive a janelinha do cronômetro)
            if w.label() == "main" {
                if let WindowEvent::Destroyed = e {
                    w.app_handle().exit(0);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("erro ao abrir o Orbe");
}
