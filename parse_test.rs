fn main() {
    let content = "some other stuff addLoginChangedListener(e){this.loginChangedListeners.push(e)} more stuff";
    
    // We want to find the parameter name.
    if let Some(start_idx) = content.find("addLoginChangedListener(") {
        let after_start = &content[start_idx + "addLoginChangedListener(".len()..];
        if let Some(end_idx) = after_start.find(")") {
            let param_name = &after_start[..end_idx];
            println!("Found parameter name: {}", param_name);
            
            let hook_old = format!("addLoginChangedListener({}){{this.loginChangedListeners.push({})}}", param_name, param_name);
            let hook_new = format!("addLoginChangedListener({}){{this.loginChangedListeners.push({});window.__xbAuth=this}}", param_name, param_name);
            
            println!("Old hook to replace: {}", hook_old);
            println!("New hook: {}", hook_new);
            
            let new_content = content.replace(&hook_old, &hook_new);
            println!("Result:\n{}", new_content);
        }
    }
}
