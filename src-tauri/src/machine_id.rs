use rand::RngCore;
use sha2::{Sha256, Sha512, Digest};
use uuid::Uuid;

pub struct MachineIds {
    pub dev_device_id: String,
    pub machine_id: String,
    pub mac_machine_id: String,
    pub sqm_id: String,
    pub service_machine_id: String,
}

pub fn generate_all() -> MachineIds {
    let dev_device_id = Uuid::new_v4().to_string();

    let mut rng = rand::thread_rng();

    let mut bytes32 = [0u8; 32];
    rng.fill_bytes(&mut bytes32);
    let machine_id = hex::encode(Sha256::digest(&bytes32));

    let mut bytes64 = [0u8; 64];
    rng.fill_bytes(&mut bytes64);
    let mac_machine_id = hex::encode(Sha512::digest(&bytes64));

    let sqm_id = format!("{{{}}}", Uuid::new_v4().to_string().to_uppercase());

    MachineIds {
        service_machine_id: dev_device_id.clone(),
        dev_device_id,
        machine_id,
        mac_machine_id,
        sqm_id,
    }
}

pub fn as_json_map(ids: &MachineIds) -> serde_json::Map<String, serde_json::Value> {
    let mut map = serde_json::Map::new();
    map.insert("telemetry.devDeviceId".into(), serde_json::Value::String(ids.dev_device_id.clone()));
    map.insert("telemetry.machineId".into(), serde_json::Value::String(ids.machine_id.clone()));
    map.insert("telemetry.macMachineId".into(), serde_json::Value::String(ids.mac_machine_id.clone()));
    map.insert("telemetry.sqmId".into(), serde_json::Value::String(ids.sqm_id.clone()));
    map.insert("storage.serviceMachineId".into(), serde_json::Value::String(ids.service_machine_id.clone()));
    map
}

pub fn storage_json_fields(ids: &MachineIds) -> serde_json::Map<String, serde_json::Value> {
    let mut map = serde_json::Map::new();
    map.insert("telemetry.devDeviceId".into(), serde_json::Value::String(ids.dev_device_id.clone()));
    map.insert("telemetry.machineId".into(), serde_json::Value::String(ids.machine_id.clone()));
    map.insert("telemetry.macMachineId".into(), serde_json::Value::String(ids.mac_machine_id.clone()));
    map.insert("telemetry.sqmId".into(), serde_json::Value::String(ids.sqm_id.clone()));
    map
}
