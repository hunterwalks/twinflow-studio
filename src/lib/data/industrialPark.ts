import { IndustrialParkSchema, type IndustrialPark } from "../types";

/**
 * 合成工业园区数据集（v0.1.0 Demo 内置）。
 * 纯合成数据，不含有任何真实客户、个人或敏感信息。
 * 引用关系（space.parentId / asset.spaceId / sensor.assetId）在测试中校验完整性。
 */
const raw = {
  spaces: [
    { id: "SP-001", name: "青云智慧产业园", type: "park", parentId: null, description: "园区级根空间对象" },
    { id: "SP-002", name: "A 座厂房", type: "building", parentId: "SP-001", description: "园区内 A 座生产厂房" },
    { id: "SP-003", name: "B 座动力站", type: "building", parentId: "SP-001", description: "园区内 B 座动力站" },
    { id: "SP-004", name: "A 座一层", type: "floor", parentId: "SP-002", description: "A 座厂房一层" },
    { id: "SP-005", name: "A 座二层", type: "floor", parentId: "SP-002", description: "A 座厂房二层" },
    { id: "SP-006", name: "B 座一层", type: "floor", parentId: "SP-003", description: "B 座动力站一层" },
    { id: "SP-007", name: "A 座一层制冷区", type: "zone", parentId: "SP-004", description: "一层中央制冷区域" },
    { id: "SP-008", name: "B 座一层冷却区", type: "zone", parentId: "SP-006", description: "一层冷却塔区域" },
  ],
  assets: [
    { id: "AS-001", name: "中央冷水机组", type: "冷水机组", spaceId: "SP-004", description: "A 座一层制冷区主机" },
    { id: "AS-002", name: "组合式空调机组", type: "空调机组", spaceId: "SP-005", description: "A 座二层空气处理" },
    { id: "AS-003", name: "园区主变压器", type: "变压器", spaceId: "SP-002", description: "A 座厂房供电" },
    { id: "AS-004", name: "冷冻水泵", type: "水泵", spaceId: "SP-007", description: "制冷区循环水泵" },
    { id: "AS-005", name: "冷却塔", type: "冷却塔", spaceId: "SP-008", description: "B 座冷却区散热" },
    { id: "AS-006", name: "10kV 开关柜", type: "开关柜", spaceId: "SP-003", description: "B 座动力站配电" },
  ],
  sensors: [
    { id: "SE-001", name: "机组出水温度", assetId: "AS-001", quantity: "温度", unit: "°C", description: "冷水机组出水温度" },
    { id: "SE-002", name: "机组供压", assetId: "AS-001", quantity: "压力", unit: "kPa", description: "冷水机组供水压力" },
    { id: "SE-003", name: "水泵流量", assetId: "AS-004", quantity: "流量", unit: "m³/h", description: "冷冻水循环流量" },
    { id: "SE-004", name: "空调振动", assetId: "AS-002", quantity: "振动", unit: "mm/s", description: "空调机组振动幅值" },
    { id: "SE-005", name: "变压器功率", assetId: "AS-003", quantity: "功率", unit: "kW", description: "主变压器实时功率" },
    { id: "SE-006", name: "开关柜电压", assetId: "AS-006", quantity: "电压", unit: "V", description: "10kV 开关柜母线电压" },
    { id: "SE-007", name: "冷却塔水温", assetId: "AS-005", quantity: "温度", unit: "°C", description: "冷却塔出水温度" },
    { id: "SE-008", name: "空调湿度", assetId: "AS-002", quantity: "湿度", unit: "%RH", description: "空调送风相对湿度" },
  ],
};

export const industrialPark: IndustrialPark = IndustrialParkSchema.parse(raw);
