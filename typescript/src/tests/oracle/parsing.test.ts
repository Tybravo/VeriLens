import { extractCreatedId } from "../../helpers/parseObjectChanges";

describe("oracle parsing", () => {
  test("OracleConfig ID is extracted", () => {
    const PACKAGE_ID = "0xABC";
    const typeName = `${PACKAGE_ID}::verilens_oracle::OracleConfig`;
    const res = extractCreatedId(
      [
        { type: "created", objectType: typeName, objectId: "0xCFG" },
      ] as any,
      typeName
    );
    expect(res).toBe("0xCFG");
  });

  test("DevMintCap ID is extracted", () => {
    const PACKAGE_ID = "0xABC";
    const typeName = `${PACKAGE_ID}::verilens_oracle::DevMintCap`;
    const res = extractCreatedId(
      [
        { type: "created", objectType: typeName, objectId: "0xCAP" },
      ] as any,
      typeName
    );
    expect(res).toBe("0xCAP");
  });
});

