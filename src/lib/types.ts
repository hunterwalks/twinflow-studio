import { z } from "zod";

/**
 * 领域模型（v0.1.0）
 * 仅覆盖核心对象的确定性结构与合成数据校验，后续版本在不破坏兼容的前提下扩展。
 */

export const SpaceTypeEnum = z.enum(["park", "building", "floor", "zone"]);
export type SpaceType = z.infer<typeof SpaceTypeEnum>;

export const SpaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: SpaceTypeEnum,
  parentId: z.string().min(1).nullable(),
  description: z.string(),
});
export type Space = z.infer<typeof SpaceSchema>;

export const AssetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  spaceId: z.string().min(1),
  description: z.string(),
});
export type Asset = z.infer<typeof AssetSchema>;

export const SensorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  assetId: z.string().min(1),
  quantity: z.string().min(1),
  unit: z.string().min(1),
  description: z.string(),
});
export type Sensor = z.infer<typeof SensorSchema>;

export const IndustrialParkSchema = z.object({
  spaces: z.array(SpaceSchema),
  assets: z.array(AssetSchema),
  sensors: z.array(SensorSchema),
});
export type IndustrialPark = z.infer<typeof IndustrialParkSchema>;

/** 空间类型的中文展示名。 */
export const SPACE_TYPE_LABEL: Record<SpaceType, string> = {
  park: "园区",
  building: "建筑",
  floor: "楼层",
  zone: "区域",
};
