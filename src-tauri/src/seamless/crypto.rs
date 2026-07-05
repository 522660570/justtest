use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes128Gcm, Nonce};
use base64::Engine as _;

const AES_KEY: &[u8; 16] = b"CursorXuBei2025!";

pub fn decrypt(b64: &str) -> Result<String, String> {
    let raw = base64::engine::general_purpose::STANDARD
        .decode(b64)
        .map_err(|e| format!("base64 decode failed: {}", e))?;

    if raw.len() < 12 {
        return Err("ciphertext too short".into());
    }

    let (nonce_bytes, ct) = raw.split_at(12);
    let key = aes_gcm::Key::<Aes128Gcm>::from_slice(AES_KEY);
    let cipher = Aes128Gcm::new(key);
    let nonce = Nonce::from_slice(nonce_bytes);

    let plain = cipher
        .decrypt(nonce, ct)
        .map_err(|e| format!("AES decrypt failed: {}", e))?;

    String::from_utf8(plain).map_err(|e| format!("UTF-8 decode failed: {}", e))
}
