/**
 * 规则注册表（v0.3.0）
 * 共 15 条确定性校验规则，按规则 ID 升序注册。
 */

import {
  R001_RequiredFieldEmpty,
  R003_SurroundingWhitespace,
  R005_DescriptionMissing,
} from "./rules/completeness";
import { R014_AssetWithoutSensor } from "./rules/coverage";
import {
  R002_IdNamingConvention,
  R004_NameTooLong,
  R013_InvalidSpaceType,
  R015_UnitQuantityMismatch,
} from "./rules/convention";
import {
  R010_HierarchyCycle,
  R011_HierarchyOrderInverted,
  R012_MissingRootSpace,
} from "./rules/hierarchy";
import { R008_DanglingReference, R009_SelfParentReference } from "./rules/reference";
import { R006_DuplicateId, R007_DuplicateSiblingName } from "./rules/uniqueness";
import type { Rule } from "./types";

export const ALL_RULES: Rule[] = [
  R001_RequiredFieldEmpty,
  R002_IdNamingConvention,
  R003_SurroundingWhitespace,
  R004_NameTooLong,
  R005_DescriptionMissing,
  R006_DuplicateId,
  R007_DuplicateSiblingName,
  R008_DanglingReference,
  R009_SelfParentReference,
  R010_HierarchyCycle,
  R011_HierarchyOrderInverted,
  R012_MissingRootSpace,
  R013_InvalidSpaceType,
  R014_AssetWithoutSensor,
  R015_UnitQuantityMismatch,
];

/** 按 ID 取规则。 */
export function findRule(id: string): Rule | undefined {
  return ALL_RULES.find((r) => r.id === id);
}
