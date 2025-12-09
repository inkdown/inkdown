use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use font_kit::source::SystemSource;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Get the configuration directory path based on the OS
#[tauri::command]
fn get_config_dir(app: tauri::AppHandle) -> Result<String, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config directory: {}", e))?;
    
    // Create directory if it doesn't exist
    fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;
    
    config_dir
        .to_str()
        .ok_or_else(|| "Invalid path".to_string())
        .map(|s| s.to_string())
}

/// Read a configuration file
#[tauri::command]
fn read_config_file(app: tauri::AppHandle, file_name: String) -> Result<String, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config directory: {}", e))?;
    
    let file_path = config_dir.join(&file_name);
    
    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file {}: {}", file_name, e))
}

/// Write a configuration file
#[tauri::command]
fn write_config_file(app: tauri::AppHandle, file_name: String, content: String) -> Result<(), String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config directory: {}", e))?;
    
    // Create directory if it doesn't exist
    fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;
    
    let file_path = config_dir.join(&file_name);
    
    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write file {}: {}", file_name, e))
}

/// List custom themes in the themes directory
#[tauri::command]
fn list_custom_themes(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config directory: {}", e))?;
    
    let themes_dir = config_dir.join("themes");
    
    // Return empty list if themes directory doesn't exist
    if !themes_dir.exists() {
        return Ok(Vec::new());
    }
    
    let mut themes = Vec::new();
    
    let entries = fs::read_dir(&themes_dir)
        .map_err(|e| format!("Failed to read themes directory: {}", e))?;
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        
        if path.is_dir() {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                themes.push(name.to_string());
            }
        }
    }
    
    Ok(themes)
}

/// Read a theme manifest file (reads manifest.json)
#[tauri::command]
fn read_theme_manifest(app: tauri::AppHandle, theme_name: String) -> Result<String, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config directory: {}", e))?;
    
    let manifest_path = config_dir
        .join("themes")
        .join(&theme_name)
        .join("manifest.json");
    
    fs::read_to_string(&manifest_path)
        .map_err(|e| format!("Failed to read theme manifest for {}: {}", theme_name, e))
}

/// Read a theme CSS file
#[tauri::command]
fn read_theme_css(app: tauri::AppHandle, theme_name: String, css_file: String) -> Result<String, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config directory: {}", e))?;
    
    let css_path = config_dir
        .join("themes")
        .join(&theme_name)
        .join(&css_file);
    
    fs::read_to_string(&css_path)
        .map_err(|e| format!("Failed to read theme CSS for {} ({}): {}", theme_name, css_file, e))
}

/// Install a community theme file (saves file to themes directory)
#[tauri::command]
fn install_community_theme_file(
    app: tauri::AppHandle,
    theme_name: String,
    file_name: String,
    content: String,
) -> Result<(), String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config directory: {}", e))?;
    
    let theme_dir = config_dir.join("themes").join(&theme_name);
    
    // Create theme directory if it doesn't exist
    fs::create_dir_all(&theme_dir)
        .map_err(|e| format!("Failed to create theme directory: {}", e))?;
    
    let file_path = theme_dir.join(&file_name);
    
    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write theme file {}: {}", file_name, e))
}

/// Uninstall a community theme (removes entire theme directory)
#[tauri::command]
fn uninstall_community_theme(app: tauri::AppHandle, theme_name: String) -> Result<(), String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config directory: {}", e))?;
    
    let theme_dir = config_dir.join("themes").join(&theme_name);
    
    // Remove theme directory if it exists
    if theme_dir.exists() {
        fs::remove_dir_all(&theme_dir)
            .map_err(|e| format!("Failed to remove theme directory: {}", e))?;
    }
    
    Ok(())
}

/// Read a specific file from a theme directory
#[tauri::command]
fn read_theme_file(
    app: tauri::AppHandle,
    theme_name: String,
    file_name: String,
) -> Result<String, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config directory: {}", e))?;
    
    let file_path = config_dir
        .join("themes")
        .join(&theme_name)
        .join(&file_name);
    
    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read theme file {}/{}: {}", theme_name, file_name, e))
}

// ============================================================================
// COMMUNITY PLUGIN OPERATIONS
// ============================================================================

/// Ensure a directory exists (create if it doesn't)
#[tauri::command]
fn ensure_dir(path: String) -> Result<(), String> {
    fs::create_dir_all(&path)
        .map_err(|e| format!("Failed to create directory {}: {}", path, e))
}

/// Read a file from a community plugin directory
#[tauri::command]
fn read_plugin_file(
    app: tauri::AppHandle,
    plugin_id: String,
    file_name: String,
) -> Result<String, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config directory: {}", e))?;
    
    let file_path = config_dir
        .join("plugins")
        .join(&plugin_id)
        .join(&file_name);
    
    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read plugin file {}/{}: {}", plugin_id, file_name, e))
}

/// Write a file to a community plugin directory
#[tauri::command]
fn write_plugin_file(
    app: tauri::AppHandle,
    plugin_id: String,
    file_name: String,
    content: String,
) -> Result<(), String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config directory: {}", e))?;
    
    let plugin_dir = config_dir.join("plugins").join(&plugin_id);
    
    // Create plugin directory if it doesn't exist
    fs::create_dir_all(&plugin_dir)
        .map_err(|e| format!("Failed to create plugin directory: {}", e))?;
    
    let file_path = plugin_dir.join(&file_name);
    
    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write plugin file {}: {}", file_name, e))
}

/// Delete a community plugin directory
#[tauri::command]
fn delete_plugin_dir(app: tauri::AppHandle, plugin_id: String) -> Result<(), String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config directory: {}", e))?;
    
    let plugin_dir = config_dir.join("plugins").join(&plugin_id);
    
    // Remove plugin directory if it exists
    if plugin_dir.exists() {
        fs::remove_dir_all(&plugin_dir)
            .map_err(|e| format!("Failed to remove plugin directory: {}", e))?;
    }
    
    Ok(())
}

/// List all installed community plugins (returns directory names)
#[tauri::command]
fn list_community_plugins(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config directory: {}", e))?;
    
    let plugins_dir = config_dir.join("plugins");
    
    // Return empty list if plugins directory doesn't exist
    if !plugins_dir.exists() {
        return Ok(Vec::new());
    }
    
    let mut plugins = Vec::new();
    
    let entries = fs::read_dir(&plugins_dir)
        .map_err(|e| format!("Failed to read plugins directory: {}", e))?;
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        
        if path.is_dir() {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                plugins.push(name.to_string());
            }
        }
    }
    
    Ok(plugins)
}

// ============================================================================
// FONT OPERATIONS
// ============================================================================

/// List all available system fonts
#[tauri::command]
fn list_system_fonts() -> Result<Vec<String>, String> {
    let source = SystemSource::new();
    
    // Get all font families from the system
    let families = source.all_families()
        .map_err(|e| format!("Failed to query system fonts: {}", e))?;
    
    // Convert to Vec, sort, and deduplicate
    let mut font_list: Vec<String> = families.into_iter().collect();
    font_list.sort();
    font_list.dedup();
    
    Ok(font_list)
}

// ============================================================================
// FILE SYSTEM OPERATIONS
// ============================================================================

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct FileNode {
    name: String,
    path: String,
    is_directory: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    children: Option<Vec<FileNode>>,
    size: Option<u64>,
    modified: Option<u64>,
}

/// Read directory structure recursively
#[tauri::command]
fn read_directory(path: String, recursive: bool) -> Result<Vec<FileNode>, String> {
    let dir_path = PathBuf::from(&path);
    
    if !dir_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    
    if !dir_path.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }
    
    read_directory_recursive(&dir_path, recursive)
}

fn read_directory_recursive(dir_path: &PathBuf, recursive: bool) -> Result<Vec<FileNode>, String> {
    let mut nodes = Vec::new();
    
    let entries = fs::read_dir(dir_path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        let metadata = entry.metadata()
            .map_err(|e| format!("Failed to read metadata: {}", e))?;
        
        let name = path.file_name()
            .and_then(|n| n.to_str())
            .ok_or_else(|| "Invalid file name".to_string())?
            .to_string();
        
        let path_str = path.to_str()
            .ok_or_else(|| "Invalid path".to_string())?
            .to_string();
        
        let is_directory = metadata.is_dir();
        
        let children = if is_directory && recursive {
            Some(read_directory_recursive(&path, recursive)?)
        } else {
            None
        };
        
        let size = if !is_directory {
            Some(metadata.len())
        } else {
            None
        };
        
        let modified = metadata.modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs());
        
        nodes.push(FileNode {
            name,
            path: path_str,
            is_directory,
            children,
            size,
            modified,
        });
    }
    
    // Sort: directories first, then by name
    nodes.sort_by(|a, b| {
        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
    
    Ok(nodes)
}

/// Read file content
#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    let file_path = PathBuf::from(&path);
    
    if !file_path.exists() {
        return Err(format!("File does not exist: {}", path));
    }
    
    if !file_path.is_file() {
        return Err(format!("Path is not a file: {}", path));
    }
    
    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

/// Read binary file content (returns base64 encoded)
#[tauri::command]
fn read_file_binary(path: String) -> Result<String, String> {
    use base64::{Engine as _, engine::general_purpose};
    
    let file_path = PathBuf::from(&path);
    
    if !file_path.exists() {
        return Err(format!("File does not exist: {}", path));
    }
    
    if !file_path.is_file() {
        return Err(format!("Path is not a file: {}", path));
    }
    
    let bytes = fs::read(&file_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    Ok(general_purpose::STANDARD.encode(&bytes))
}

/// Write file content
#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    let file_path = PathBuf::from(&path);
    
    // Create parent directories if they don't exist
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directories: {}", e))?;
    }
    
    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write file: {}", e))
}

/// Write binary file content (base64 encoded)
#[tauri::command]
fn write_file_binary(path: String, data: String) -> Result<(), String> {
    use base64::{Engine as _, engine::general_purpose};
    
    let file_path = PathBuf::from(&path);
    
    // Create parent directories if they don't exist
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directories: {}", e))?;
    }
    
    // Decode base64 data
    let bytes = general_purpose::STANDARD
        .decode(&data)
        .map_err(|e| format!("Failed to decode base64 data: {}", e))?;
    
    fs::write(&file_path, bytes)
        .map_err(|e| format!("Failed to write binary file: {}", e))
}

/// Create a new file
#[tauri::command]
fn create_file(path: String) -> Result<(), String> {
    let file_path = PathBuf::from(&path);
    
    if file_path.exists() {
        return Err(format!("File already exists: {}", path));
    }
    
    // Create parent directories if they don't exist
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directories: {}", e))?;
    }
    
    fs::write(&file_path, "")
        .map_err(|e| format!("Failed to create file: {}", e))
}

/// Create a new directory
#[tauri::command]
fn create_directory(path: String) -> Result<(), String> {
    let dir_path = PathBuf::from(&path);
    
    if dir_path.exists() {
        return Err(format!("Directory already exists: {}", path));
    }
    
    fs::create_dir_all(&dir_path)
        .map_err(|e| format!("Failed to create directory: {}", e))
}

/// Rename a file or directory
#[tauri::command]
fn rename_path(old_path: String, new_path: String) -> Result<(), String> {
    let old = PathBuf::from(&old_path);
    let new = PathBuf::from(&new_path);
    
    if !old.exists() {
        return Err(format!("Source path does not exist: {}", old_path));
    }
    
    if new.exists() {
        return Err(format!("Destination path already exists: {}", new_path));
    }
    
    fs::rename(&old, &new)
        .map_err(|e| format!("Failed to rename: {}", e))
}

/// Delete a file or directory
#[tauri::command]
fn delete_path(path: String) -> Result<(), String> {
    let file_path = PathBuf::from(&path);
    
    if !file_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    
    if file_path.is_dir() {
        fs::remove_dir_all(&file_path)
            .map_err(|e| format!("Failed to delete directory: {}", e))
    } else {
        fs::remove_file(&file_path)
            .map_err(|e| format!("Failed to delete file: {}", e))
    }
}

/// Move a file or directory
#[tauri::command]
fn move_path(source: String, destination: String) -> Result<(), String> {
    let src = PathBuf::from(&source);
    let dest = PathBuf::from(&destination);
    
    if !src.exists() {
        return Err(format!("Source path does not exist: {}", source));
    }
    
    // If destination is a directory, move source into it
    let final_dest = if dest.is_dir() {
        let file_name = src.file_name()
            .ok_or_else(|| "Invalid source file name".to_string())?;
        dest.join(file_name)
    } else {
        dest
    };
    
    if final_dest.exists() {
        return Err(format!("Destination already exists: {}", final_dest.display()));
    }
    
    // Create parent directories if they don't exist
    if let Some(parent) = final_dest.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directories: {}", e))?;
    }
    
    fs::rename(&src, &final_dest)
        .map_err(|e| format!("Failed to move: {}", e))
}

/// Copy a file to a new location
#[tauri::command]
fn copy_file(source: String, destination: String) -> Result<(), String> {
    let src = PathBuf::from(&source);
    let dest = PathBuf::from(&destination);
    
    if !src.exists() {
        return Err(format!("Source file does not exist: {}", source));
    }
    
    // Check if source is a directory
    if src.is_dir() {
        // If destination is a directory, copy into it with same name
        let final_dest = if dest.is_dir() {
            let file_name = src.file_name()
                .ok_or_else(|| "Invalid source directory name".to_string())?;
            dest.join(file_name)
        } else {
            dest
        };

        // If destination exists, add (copy) or (copy N) suffix
        let mut target_path = final_dest.clone();
        if target_path.exists() {
            let file_stem = target_path.file_stem()
                .and_then(|s| s.to_str())
                .ok_or_else(|| "Invalid directory name".to_string())?
                .to_string();
            // Directories usually don't have extensions we care about for renaming, but let's keep logic consistent
            let extension = target_path.extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_string();
            
            let parent = target_path.parent()
                .ok_or_else(|| "Invalid parent directory".to_string())?
                .to_path_buf();
            
            let ext_suffix = if extension.is_empty() { String::new() } else { format!(".{}", extension) };
            target_path = parent.join(format!("{} (copy){}", file_stem, ext_suffix));
            
            let mut counter = 2;
            while target_path.exists() {
                target_path = parent.join(format!("{} (copy {}){}", file_stem, counter, ext_suffix));
                counter += 1;
                if counter > 1000 {
                    return Err("Too many copies already exist".to_string());
                }
            }
        }

        // Perform recursive copy
        copy_dir_recursive(&src, &target_path)?;
        return Ok(());
    }

    if !src.is_file() {
        return Err(format!("Source is not a file or directory: {}", source));
    }
    
    // If destination is a directory, copy into it with same name
    let final_dest = if dest.is_dir() {
        let file_name = src.file_name()
            .ok_or_else(|| "Invalid source file name".to_string())?;
        dest.join(file_name)
    } else {
        dest
    };
    
    // If destination exists, add (copy) or (copy N) suffix
    let mut target_path = final_dest.clone();
    if target_path.exists() {
        let file_stem = target_path.file_stem()
            .and_then(|s| s.to_str())
            .ok_or_else(|| "Invalid file name".to_string())?
            .to_string();
        let extension = target_path.extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_string();
        
        let parent = target_path.parent()
            .ok_or_else(|| "Invalid parent directory".to_string())?
            .to_path_buf();
        
        // Try "file (copy).ext" first
        let ext_suffix = if extension.is_empty() { String::new() } else { format!(".{}", extension) };
        target_path = parent.join(format!("{} (copy){}", file_stem, ext_suffix));
        
        // If that exists, try "file (copy 2).ext", "file (copy 3).ext", etc.
        let mut counter = 2;
        while target_path.exists() {
            target_path = parent.join(format!("{} (copy {}){}", file_stem, counter, ext_suffix));
            counter += 1;
            
            // Safety limit to prevent infinite loop
            if counter > 1000 {
                return Err("Too many copies already exist".to_string());
            }
        }
    }
    
    // Create parent directories if they don't exist
    if let Some(parent) = target_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directories: {}", e))?;
    }
    
    fs::copy(&src, &target_path)
        .map_err(|e| format!("Failed to copy file: {}", e))?;
    
    Ok(())
}

fn copy_dir_recursive(src: &PathBuf, dest: &PathBuf) -> Result<(), String> {
    fs::create_dir_all(dest)
        .map_err(|e| format!("Failed to create directory {}: {}", dest.display(), e))?;

    for entry in fs::read_dir(src).map_err(|e| format!("Failed to read directory {}: {}", src.display(), e))? {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let entry_path = entry.path();
        let dest_path = dest.join(entry.file_name());

        if entry_path.is_dir() {
            copy_dir_recursive(&entry_path, &dest_path)?;
        } else {
            fs::copy(&entry_path, &dest_path)
                .map_err(|e| format!("Failed to copy file {}: {}", entry_path.display(), e))?;
        }
    }
    Ok(())
}

/// Check if path exists
#[tauri::command]
fn path_exists(path: String) -> bool {
    PathBuf::from(&path).exists()
}

// ============================================================================
// Dialog Commands - For file/folder selection dialogs
// ============================================================================

/// Options for file dialog
#[derive(serde::Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct FileDialogOptions {
    /// Dialog title
    title: Option<String>,
    /// Default path/directory
    default_path: Option<String>,
    /// File filters (e.g., [{ name: "PDF", extensions: ["pdf"] }])
    filters: Option<Vec<FileFilter>>,
    /// Default file name (for save dialog)
    default_name: Option<String>,
}

#[derive(serde::Deserialize)]
struct FileFilter {
    name: String,
    extensions: Vec<String>,
}

/// Open a save file dialog - returns the selected file path or null if cancelled
#[tauri::command]
async fn show_save_dialog(app: tauri::AppHandle, options: FileDialogOptions) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let mut dialog = app.dialog().file();
    
    if let Some(title) = options.title {
        dialog = dialog.set_title(&title);
    }
    
    if let Some(default_path) = options.default_path {
        dialog = dialog.set_directory(&default_path);
    }
    
    if let Some(default_name) = options.default_name {
        dialog = dialog.set_file_name(&default_name);
    }
    
    if let Some(filters) = options.filters {
        for filter in filters {
            let extensions: Vec<&str> = filter.extensions.iter().map(|s| s.as_str()).collect();
            dialog = dialog.add_filter(&filter.name, &extensions);
        }
    }
    
    let result = dialog.blocking_save_file();
    
    match result {
        Some(path) => Ok(Some(path.to_string())),
        None => Ok(None),
    }
}

/// Open a file selection dialog - returns the selected file path or null if cancelled
#[tauri::command]
async fn show_open_file_dialog(app: tauri::AppHandle, options: FileDialogOptions) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let mut dialog = app.dialog().file();
    
    if let Some(title) = options.title {
        dialog = dialog.set_title(&title);
    }
    
    if let Some(default_path) = options.default_path {
        dialog = dialog.set_directory(&default_path);
    }
    
    if let Some(filters) = options.filters {
        for filter in filters {
            let extensions: Vec<&str> = filter.extensions.iter().map(|s| s.as_str()).collect();
            dialog = dialog.add_filter(&filter.name, &extensions);
        }
    }
    
    let result = dialog.blocking_pick_file();
    
    match result {
        Some(path) => Ok(Some(path.to_string())),
        None => Ok(None),
    }
}

/// Open multiple file selection dialog - returns array of selected file paths
#[tauri::command]
async fn show_open_files_dialog(app: tauri::AppHandle, options: FileDialogOptions) -> Result<Vec<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let mut dialog = app.dialog().file();
    
    if let Some(title) = options.title {
        dialog = dialog.set_title(&title);
    }
    
    if let Some(default_path) = options.default_path {
        dialog = dialog.set_directory(&default_path);
    }
    
    if let Some(filters) = options.filters {
        for filter in filters {
            let extensions: Vec<&str> = filter.extensions.iter().map(|s| s.as_str()).collect();
            dialog = dialog.add_filter(&filter.name, &extensions);
        }
    }
    
    let result = dialog.blocking_pick_files();
    
    match result {
        Some(paths) => Ok(paths.iter().map(|p| p.to_string()).collect()),
        None => Ok(vec![]),
    }
}

/// Open a folder selection dialog - returns the selected folder path or null if cancelled
#[tauri::command]
async fn show_open_folder_dialog(app: tauri::AppHandle, options: FileDialogOptions) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let mut dialog = app.dialog().file();
    
    if let Some(title) = options.title {
        dialog = dialog.set_title(&title);
    }
    
    if let Some(default_path) = options.default_path {
        dialog = dialog.set_directory(&default_path);
    }
    
    let result = dialog.blocking_pick_folder();
    
    match result {
        Some(path) => Ok(Some(path.to_string())),
        None => Ok(None),
    }
}

/// Apply window configuration (decorations) based on config file
fn apply_window_config(app: &tauri::AppHandle) {
    use serde_json::Value;
    
    // Read window config
    if let Ok(config_dir) = app.path().app_config_dir() {
        let window_config_path = config_dir.join("window.json");
        
        if let Ok(content) = fs::read_to_string(&window_config_path) {
            if let Ok(config) = serde_json::from_str::<Value>(&content) {
                if let Some(custom_titlebar) = config.get("customTitleBar").and_then(|v| v.as_bool()) {
                    if let Some(window) = app.get_webview_window("main") {
                        if custom_titlebar {
                            // Custom titlebar: use Overlay style for native rounded corners on macOS
                            #[cfg(target_os = "macos")]
                            {
                                use tauri::TitleBarStyle;
                                let _ = window.set_title_bar_style(TitleBarStyle::Overlay);
                                // Traffic light position is set in tauri.conf.json
                            }
                            
                            // On Windows/Linux, disable decorations for custom titlebar
                            #[cfg(not(target_os = "macos"))]
                            {
                                let _ = window.set_decorations(false);
                            }
                        } else {
                            // Native titlebar: use default decorations
                            let _ = window.set_decorations(true);
                            
                            #[cfg(target_os = "macos")]
                            {
                                use tauri::TitleBarStyle;
                                let _ = window.set_title_bar_style(TitleBarStyle::Visible);
                            }
                        }
                    }
                }
            }
        }
    }
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            // Apply window configuration on startup
            apply_window_config(&app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_config_dir,
            read_config_file,
            write_config_file,
            list_custom_themes,
            read_theme_manifest,
            read_theme_css,
            install_community_theme_file,
            uninstall_community_theme,
            read_theme_file,
            list_system_fonts,
            // Community plugin operations
            ensure_dir,
            read_plugin_file,
            write_plugin_file,
            delete_plugin_dir,
            list_community_plugins,
            // File system operations
            read_directory,
            read_file,
            read_file_binary,
            write_file,
            write_file_binary,
            create_file,
            create_directory,
            rename_path,
            delete_path,
            move_path,
            copy_file,
            path_exists,
            // Dialog operations
            show_save_dialog,
            show_open_file_dialog,
            show_open_files_dialog,
            show_open_folder_dialog
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
