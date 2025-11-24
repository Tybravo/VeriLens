import { extractCreatedId, extractCreatedIds } from "../../helpers/parseObjectChanges";

describe("parseObjectChanges", () => {
  const objectChanges = [
    {
      type: "created",
      objectType: "0xP::verilens_oracle::OracleConfig",
      objectId: "0xCONFIG",
    },
    {
      type: "created",
      objectType: "0xP::verilens_oracle::DevMintCap",
      objectId: "0xCAP1",
    },
    {
      type: "created",
      objectType: "0xP::verilens_oracle::DevMintCap",
      objectId: "0xCAP2",
    },
  ] as any[];

  test("extract single created id", () => {
    expect(extractCreatedId(objectChanges as any, "0xP::verilens_oracle::OracleConfig")).toBe("0xCONFIG");
  });

  test("extract multiple created ids", () => {
    expect(extractCreatedIds(objectChanges as any, "0xP::verilens_oracle::DevMintCap")).toEqual(["0xCAP1", "0xCAP2"]);
  });
});

