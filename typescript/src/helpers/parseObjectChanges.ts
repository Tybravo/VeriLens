import { SuiObjectChange, SuiObjectChangeCreated } from "@mysten/sui/client";

export const extractCreatedId = (
  objectChanges: SuiObjectChange[] | undefined,
  typeName: string
): string | undefined => {
  if (!objectChanges) return undefined;
  const created = objectChanges.filter(({ type }) => type === "created") as SuiObjectChangeCreated[];
  const match = created.find(({ objectType }) => objectType === typeName);
  return match?.objectId;
};

export const extractCreatedIds = (
  objectChanges: SuiObjectChange[] | undefined,
  typeName: string
): string[] => {
  if (!objectChanges) return [];
  const created = objectChanges.filter(({ type }) => type === "created") as SuiObjectChangeCreated[];
  return created.filter(({ objectType }) => objectType === typeName).map(({ objectId }) => objectId);
};

