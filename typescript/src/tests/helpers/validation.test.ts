import { validateExpectedCodeHash, validateCompressedSecp256k1Pubkey } from "../../helpers/validation";

describe("validation helpers", () => {
  test("expected code hash valid", () => {
    const hex = "a".repeat(64);
    expect(validateExpectedCodeHash(hex)).toBe(hex);
  });
  test("expected code hash invalid length", () => {
    expect(() => validateExpectedCodeHash("aa")) .toThrow();
  });
  test("compressed pubkey valid 02 prefix", () => {
    const hex = "02" + "b".repeat(64);
    expect(validateCompressedSecp256k1Pubkey(hex)).toBe(hex);
  });
  test("compressed pubkey invalid prefix", () => {
    const hex = "04" + "b".repeat(64);
    expect(() => validateCompressedSecp256k1Pubkey(hex)).toThrow();
  });
});

