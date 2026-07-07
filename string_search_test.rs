fn main() {
    let content = "blah addLoginChangedListener(e){this.loginChangedListeners.push(e)} blah";
    
    let prefix = "addLoginChangedListener(";
    let suffix = "){this.loginChangedListeners.push(";
    
    if let Some(pos) = content.find(prefix) {
        let after_prefix = &content[pos + prefix.len()..];
        if let Some(end_paren) = after_prefix.find(')') {
            let var_name = &after_prefix[..end_paren];
            
            // Reconstruct the full string to find
            let target = format!("addLoginChangedListener({}){{this.loginChangedListeners.push({})}}", var_name, var_name);
            println!("Target to replace: {}", target);
            
            let hook_new = format!("addLoginChangedListener({}){{this.loginChangedListeners.push({});window.__xbAuth=this}}", var_name, var_name);
            println!("Replacement: {}", hook_new);
            
            let new_content = content.replace(&target, &hook_new);
            println!("New content: {}", new_content);
        }
    }
}
