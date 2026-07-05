mod commands;
mod cursor_db;
mod machine_id;
mod process;
mod seamless;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // System / Path
            commands::get_platform,
            commands::get_homedir,
            commands::path_join,
            commands::get_app_version,
            commands::get_app_environment,
            commands::get_debug_mode,
            // Config file
            commands::read_config_file,
            commands::write_config_file,
            commands::delete_config_file,
            commands::get_config_file_info,
            // File system
            commands::fs_access,
            commands::fs_read_file,
            commands::fs_write_file,
            commands::list_directory,
            commands::unlock_file,
            // SQLite
            commands::sqlite_query,
            commands::sqlite_batch_run,
            // Command execution
            commands::exec_command,
            commands::exec_command_async,
            commands::spawn_detached,
            // Process
            commands::check_cursor_process,
            commands::kill_cursor_process,
            commands::start_cursor,
            commands::find_cursor_executable_cmd,
            commands::find_cursor_db_cmd,
            // MAC address
            commands::get_mac_address,
            // Registry
            commands::read_windows_registry,
            commands::update_windows_registry,
            // Auth
            commands::exchange_session_token_for_access_token,
            // Admin
            commands::check_admin_rights,
            // Logging
            commands::get_log_path,
            commands::read_log_file,
            commands::clear_log_file,
            // Cursor version
            commands::get_cursor_version,
            // Machine ID operations
            commands::generate_machine_ids,
            commands::reset_machine_ids_in_db,
            commands::reset_storage_json,
            // Seamless (workbench injection + HTTP server)
            commands::inject_workbench,
            commands::restore_workbench,
            commands::get_seamless_status,
            commands::start_http_server,
            commands::stop_http_server,
            commands::fetch_account_encrypted,
            commands::get_quota_status,
            commands::reload_cursor_window,
            commands::push_pending_switch,
            commands::debug_quota_check,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
