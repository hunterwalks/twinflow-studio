import type { RuleDataset } from "../rules/types";

/**
 * 合成「含问题样例」数据集（v0.3.0）
 *
 * 用途：在 /validate 页面演示 15 条规则的实际命中效果。
 * 纯合成数据，不含任何真实客户、项目、个人或敏感信息。
 * 为了覆盖各类规则，本数据集**故意**包含脏数据，不要作为建模范例使用。
 *
 * 有意植入的问题（括号内为对应规则）：
 * - SP-900 类型 workshop 非法（R013）
 * - SP-901 名称为空（R001）
 * - SP-902 / SP-903 互为父级，构成环（R010）
 * - SP-904 父级指向自身（R009）
 * - SP-905 父级 SP-999 不存在（R008）
 * - SP-906 与 SP-001 同为根层级同名（R007）；ID 与 SP-906 重复（R006）
 * - space999 ID 不符合命名规范（R002）
 * - SP-907 楼层挂在区域之下，层级倒置（R011）
 * - AS-900 空间ID 为空（R001）；描述为空（R005）
 * - AS-901 名称含首尾空白（R003）
 * - AS-902 名称过长（R004）
 * - AS-903 未被任何测点引用（R014）
 * - SE-900 量纲温度 / 单位 kPa 不匹配（R015）
 * - 全表无 parentId 为空的根空间由另一个样例演示（R012），此处保留 SP-001 作为根
 */
export const messyPark: RuleDataset = {
  observations: [],
  spaces: [
    {
      id: "SP-001",
      name: "青云智慧产业园",
      type: "park",
      parentId: "",
      description: "园区级根空间对象",
    },
    {
      id: "SP-900",
      name: "A 座车间",
      type: "workshop",
      parentId: "SP-001",
      description: "类型取值不在允许范围",
    },
    {
      id: "SP-901",
      name: "",
      type: "building",
      parentId: "SP-001",
      description: "名称缺失",
    },
    {
      id: "SP-902",
      name: "环形空间甲",
      type: "floor",
      parentId: "SP-903",
      description: "与 SP-903 互为父级",
    },
    {
      id: "SP-903",
      name: "环形空间乙",
      type: "floor",
      parentId: "SP-902",
      description: "与 SP-902 互为父级",
    },
    {
      id: "SP-904",
      name: "自引用空间",
      type: "zone",
      parentId: "SP-904",
      description: "父级指向自身",
    },
    {
      id: "SP-905",
      name: "悬空引用空间",
      type: "floor",
      parentId: "SP-999",
      description: "父级不存在",
    },
    {
      id: "SP-906",
      name: "青云智慧产业园",
      type: "park",
      parentId: "",
      description: "与根空间同名",
    },
    {
      id: "SP-906",
      name: "重复编号空间",
      type: "building",
      parentId: "SP-001",
      description: "ID 与上一行重复",
    },
    {
      id: "space999",
      name: "编码不规范空间",
      type: "building",
      parentId: "SP-001",
      description: "ID 命名不符合规范",
    },
    {
      id: "SP-908",
      name: "B 座一层冷却区",
      type: "zone",
      parentId: "SP-001",
      description: "冷却塔区域",
    },
    {
      id: "SP-907",
      name: "倒置楼层",
      type: "floor",
      parentId: "SP-908",
      description: "楼层被挂在区域之下",
    },
  ],
  assets: [
    {
      id: "AS-900",
      name: "无空间设备",
      type: "水泵",
      spaceId: "",
      description: "",
    },
    {
      id: "AS-901",
      name: "  组合式空调机组  ",
      type: "空调机组",
      spaceId: "SP-001",
      description: "名称含首尾空白",
    },
    {
      id: "AS-902",
      name: "园区西北角一号动力站高压配电室主进线柜备用回路测试设备甲乙丙丁戊己庚辛壬癸子丑寅卯",
      type: "开关柜",
      spaceId: "SP-001",
      description: "名称过长",
    },
    {
      id: "AS-903",
      name: "无测点设备",
      type: "变压器",
      spaceId: "SP-001",
      description: "没有任何测点引用它",
    },
    {
      id: "AS-904",
      name: "中央冷水机组",
      type: "冷水机组",
      spaceId: "SP-908",
      description: "正常设备",
    },
  ],
  sensors: [
    {
      id: "SE-900",
      name: "机组出水温度",
      assetId: "AS-904",
      quantity: "温度",
      unit: "kPa",
      description: "单位与量纲不匹配",
    },
    {
      id: "SE-901",
      name: "机组供压",
      assetId: "AS-904",
      quantity: "压力",
      unit: "kPa",
      description: "正常测点",
    },
    {
      id: "SE-902",
      name: "空调振动",
      assetId: "AS-901",
      quantity: "振动",
      unit: "mm/s",
      description: "正常测点",
    },
  ],
};

/**
 * 合成「无根空间」样例：用于演示 R012。
 * 所有空间都有父级，缺少层级入口。
 */
export const rootlessSpaces: RuleDataset = {
  observations: [],
  spaces: [
    {
      id: "SP-910",
      name: "甲区",
      type: "building",
      parentId: "SP-911",
      description: "父级为乙区",
    },
    {
      id: "SP-911",
      name: "乙区",
      type: "building",
      parentId: "SP-912",
      description: "父级为丙区",
    },
    {
      id: "SP-912",
      name: "丙区",
      type: "building",
      parentId: "SP-910",
      description: "父级为甲区，整体成环且无根",
    },
  ],
  assets: [],
  sensors: [],
};
