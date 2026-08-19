import type { RuleDataset } from "../rules/types";

/**
 * 合成「城市基础设施（含问题）」数据集（v0.7.0 新增）
 *
 * 用途：演示规则引擎在城市基础设施场景下的实际命中效果。
 * 纯合成数据，不含任何真实客户、项目、个人或敏感信息。
 * 为覆盖各类规则，本数据集**故意**植入脏数据，不要作为建模范例使用。
 *
 * 有意植入的问题（括号内为对应规则）：
 * - SP-203 类型 station 非法（R013）
 * - SP-204 名称为空（R001）
 * - SP-205 / SP-206 互为父级，构成环（R010）
 * - SP-207 父级指向自身（R009）
 * - SP-208 父级 SP-999 不存在（R008）
 * - SP-201 与上方根空间 ID 重复（R006）；根层级同名（R007）
 * - zone01 ID 不符合命名规范（R002）
 * - SP-209 楼层挂在区域 SP-210 之下，层级倒置（R011）
 * - AS-201 空间ID 为空（R001）；描述为空（R005）
 * - AS-202 名称含首尾空白（R003）
 * - AS-203 名称过长（R004）
 * - AS-204 未被任何测点引用（R014）
 * - SE-201 量纲温度 / 单位 kPa 不匹配（R015）
 */
export const cityInfraProblem: RuleDataset = {
  observations: [
    { id: "OB-201", sensorId: "SE-999", timestamp: "2026-08-10T10:00:00Z", value: "23.5" },
    { id: "OB-202", sensorId: "SE-202", timestamp: "not-a-date", value: "12" },
    { id: "OB-203", sensorId: "SE-202", timestamp: "2026-08-10T11:00:00Z", value: "abc" },
    { id: "OB-204", sensorId: "SE-202", timestamp: "2026-08-10T12:00:00Z", value: "10" },
    { id: "OB-205", sensorId: "SE-202", timestamp: "2026-08-10T12:00:00Z", value: "11" },
    { id: "OB-206", sensorId: "SE-201", timestamp: "2026-08-10T13:00:00Z", value: "25.3" },
  ],
  spaces: [
    { id: "SP-201", name: "滨江智慧城区", type: "park", parentId: "", description: "城市级根空间对象" },
    { id: "SP-202", name: "A 座能源楼", type: "building", parentId: "SP-201", description: "城区内 A 座能源楼" },
    { id: "SP-203", name: "调度中心", type: "station", parentId: "SP-201", description: "类型取值不在允许范围" },
    { id: "SP-204", name: "", type: "building", parentId: "SP-201", description: "名称缺失" },
    { id: "SP-205", name: "环形空间甲", type: "floor", parentId: "SP-206", description: "与 SP-206 互为父级" },
    { id: "SP-206", name: "环形空间乙", type: "floor", parentId: "SP-205", description: "与 SP-205 互为父级" },
    { id: "SP-207", name: "自引用泵房", type: "zone", parentId: "SP-207", description: "父级指向自身" },
    { id: "SP-208", name: "悬空空间", type: "floor", parentId: "SP-999", description: "父级不存在" },
    {
      id: "SP-201",
      name: "滨江智慧城区",
      type: "park",
      parentId: "",
      description: "ID 与根空间重复、同名",
    },
    {
      id: "zone01",
      name: "编码不规范空间",
      type: "building",
      parentId: "SP-201",
      description: "ID 命名不符合规范",
    },
    { id: "SP-210", name: "泵房区", type: "zone", parentId: "SP-202", description: "B 座能源楼泵房区" },
    { id: "SP-209", name: "倒置楼层", type: "floor", parentId: "SP-210", description: "楼层被挂在区域之下" },
  ],
  assets: [
    { id: "AS-201", name: "无空间设备", type: "水泵", spaceId: "", description: "" },
    { id: "AS-202", name: "  智能照明控制器  ", type: "照明", spaceId: "SP-201", description: "名称含首尾空白" },
    {
      id: "AS-203",
      name: "园区西北角一号动力站高压配电室主进线柜备用回路测试设备甲乙丙丁戊己庚辛壬癸子丑寅卯",
      type: "开关柜",
      spaceId: "SP-201",
      description: "名称过长",
    },
    { id: "AS-204", name: "中央冷站", type: "冷站", spaceId: "SP-202", description: "没有任何测点引用它" },
    { id: "AS-205", name: "主变电所", type: "变电", spaceId: "SP-203", description: "正常设备" },
  ],
  sensors: [
    { id: "SE-201", name: "机组供水温度", assetId: "AS-205", quantity: "温度", unit: "kPa", description: "单位与量纲不匹配" },
    { id: "SE-202", name: "照明功率", assetId: "AS-202", quantity: "功率", unit: "kW", description: "正常测点" },
  ],
};
