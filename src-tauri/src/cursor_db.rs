use rusqlite::Connection;
use serde_json::Value;

pub fn query(db_path: &str, sql: &str, sql_params: &[Value]) -> Result<Value, String> {
    let conn = Connection::open(db_path).map_err(|e| format!("Failed to open DB: {}", e))?;
    let mut stmt = conn.prepare(sql).map_err(|e| format!("Failed to prepare: {}", e))?;

    let params: Vec<Box<dyn rusqlite::types::ToSql>> = sql_params.iter()
        .map(|v| {
            let b: Box<dyn rusqlite::types::ToSql> = match v {
                Value::String(s) => Box::new(s.clone()),
                Value::Number(n) => {
                    if let Some(i) = n.as_i64() { Box::new(i) }
                    else if let Some(f) = n.as_f64() { Box::new(f) }
                    else { Box::new(n.to_string()) }
                }
                Value::Null => Box::new(rusqlite::types::Null),
                _ => Box::new(v.to_string()),
            };
            b
        })
        .collect::<Vec<_>>();

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let col_count = stmt.column_count();
    if col_count > 0 {
        let rows = stmt.query_map(param_refs.as_slice(), |row| {
            let mut map = serde_json::Map::new();
            for i in 0..row.as_ref().column_count() {
                let name = row.as_ref().column_name(i).unwrap_or(&format!("col{}", i)).to_string();
                let val: rusqlite::types::Value = row.get_unwrap(i);
                map.insert(name, rusqlite_val_to_json(val));
            }
            Ok(map)
        }).map_err(|e| format!("Query failed: {}", e))?;

        let mut results = Vec::new();
        for row in rows {
            results.push(serde_json::Value::Object(row.map_err(|e| format!("Row error: {}", e))?));
        }
        Ok(serde_json::Value::Array(results))
    } else {
        let changes = stmt.execute(param_refs.as_slice())
            .map_err(|e| format!("Execute failed: {}", e))?;
        let last_id = conn.last_insert_rowid();
        Ok(serde_json::json!({ "changes": changes, "lastID": last_id }))
    }
}

pub fn batch_run(db_path: &str, statements: &[Value]) -> Result<Value, String> {
    let conn = Connection::open(db_path).map_err(|e| format!("Failed to open DB: {}", e))?;
    let tx = conn.unchecked_transaction()
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    let mut results = Vec::new();
    for stmt_val in statements {
        let sql = stmt_val["sql"].as_str().unwrap_or("").to_string();
        let params = stmt_val["params"].as_array().cloned().unwrap_or_default();

        let p: Vec<Box<dyn rusqlite::types::ToSql>> = params.iter()
            .map(|v| {
                let b: Box<dyn rusqlite::types::ToSql> = match v {
                    Value::String(s) => Box::new(s.clone()),
                    Value::Number(n) => {
                        if let Some(i) = n.as_i64() { Box::new(i) }
                        else if let Some(f) = n.as_f64() { Box::new(f) }
                        else { Box::new(n.to_string()) }
                    }
                    Value::Null => Box::new(rusqlite::types::Null),
                    _ => Box::new(v.to_string()),
                };
                b
            })
            .collect::<Vec<_>>();
        let pr: Vec<&dyn rusqlite::types::ToSql> = p.iter().map(|x| x.as_ref()).collect();

        match tx.execute(&sql, pr.as_slice()) {
            Ok(changes) => results.push(serde_json::json!({ "success": true, "changes": changes })),
            Err(e) => {
                let _ = tx.rollback();
                return Err(format!("Batch statement failed: {}", e));
            }
        }
    }

    tx.commit().map_err(|e| format!("Commit failed: {}", e))?;
    Ok(serde_json::json!({ "success": true, "results": results }))
}

fn rusqlite_val_to_json(val: rusqlite::types::Value) -> Value {
    match val {
        rusqlite::types::Value::Null => Value::Null,
        rusqlite::types::Value::Integer(i) => Value::Number(i.into()),
        rusqlite::types::Value::Real(f) => {
            serde_json::Number::from_f64(f).map(Value::Number).unwrap_or(Value::Null)
        }
        rusqlite::types::Value::Text(s) => Value::String(s),
        rusqlite::types::Value::Blob(b) => Value::String(hex::encode(b)),
    }
}
