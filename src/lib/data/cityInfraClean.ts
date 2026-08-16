import { IndustrialParkSchema, type IndustrialPark } from "../types";

/**
 * 合成「城市基础设施（干净）」数据集（v0.7.0 新增）
 *
 * 纯合成数据，不含有任何真实客户、项目、个人或敏感信息。
 * 结构完整：park → building → floor → zone 层级正确、引用闭合、
 * 每个资产都有测点引用、量纲与单位一致。用于验证「干净数据不应产生规则误报」。
 */
const raw = {
  spaces: [
    { id: "SP-101", name: "滨江智慧城区", type: "park", parentId: null, description: "城市级根空间对象" },
    { id: "SP-102", name: "A 座综合楼", type: "building", parentId: "SP-101", description: "城区内 A 座综合楼" },
    { id: "SP-103", name: "B 座能源中心", type: "building", parentId: "SP-101", description: "城区内 B 座能源中心" },
    { id: "SP-104", name: "A 座一层", type: "floor", parentId: "SP-102", description: "A 座综合楼一层" },
    { id: "SP-105", name: "A 座二层", type: "floor", parentId: "SP-102", description: "A 座综合楼二层" },
    { id: "SP-106", name: "B 座一层", type: "floor", parentId: "SP-103", description: "B 座能源中心一层" },
    { id: "SP-107", name: "A 座一层配电区", type: "zone", parentId: "SP-104", description: "一层配电区域" },
    { id: "SP-108", name: "B 座一层泵房区", type: "zone", parentId: "SP-106", description: "一层泵房区域" },
  ],
  assets: [
    { id: "AS-101", name: "区域供冷机组", type: "冷站", spaceId: "SP-104", description: "A 座一层制冷主机" },
    { id: "AS-102", name: "智能照明控制器", type: "照明", spaceId: "SP-105", description: "A 座二层照明控制" },
    { id: "AS-103", name: "主变电所", type: "变电", spaceId: "SP-102", description: "A 座综合楼供电" },
    { id: "AS-104", name: "加压水泵", type: "水泵", spaceId: "SP-107", description: "配电区循环水泵" },
    { id: "AS-105", name: "分布式光伏逆变器", type: "光伏", spaceId: "SP-103", description: "B 座能源中心光伏" },
    { id: "AS-106", name: "10kV 开关柜", type: "开关柜", spaceId: "SP-108", description: "B 座泵房区配电" },
  ],
  sensors: [
    { id: "SE-101", name: "机组供水温度", assetId: "AS-101", quantity: "温度", unit: "°C", description: "供冷机组供水温度" },
    { id: "SE-102", name: "机组回水压力", assetId: "AS-101", quantity: "压力", unit: "kPa", description: "供冷机组回水压力" },
    { id: "SE-103", name: "照明回路功率", assetId: "AS-102", quantity: "功率", unit: "kW", description: "照明回路实时功率" },
    { id: "SE-104", name: "变压器负载率", assetId: "AS-103", quantity: "功率", unit: "kW", description: "主变电所负载率" },
    { id: "SE-105", name: "水泵流量", assetId: "AS-104", quantity: "流量", unit: "m³/h", description: "加压水泵循环流量" },
    { id: "SE-106", name: "光伏瞬时功率", assetId: "AS-105", quantity: "功率", unit: "kW", description: "光伏逆变器瞬时功率" },
    { id: "SE-107", name: "开关柜母线电压", assetId: "AS-106", quantity: "电压", unit: "kV", description: "10kV 开关柜母线电压" },
    { id: "SE-108", name: "水泵振动", assetId: "AS-104", quantity: "振动", unit: "mm/s", description: "加压水泵振动幅值" },
  ],
};

export const cityInfraClean: IndustrialPark = IndustrialParkSchema.parse(raw);
