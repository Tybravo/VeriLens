import { createOracleConfig } from "../oracle/createConfig";

const main = async () => {
  const args = process.argv.slice(2);
  const flags = Object.fromEntries(args.map((a) => a.split("=", 2)).filter(([k, v]) => k && v));
  const posExpected = args[0] && args[0].includes("=") ? undefined : args[0];
  const posPubkey = args[1] && args[1].includes("=") ? undefined : args[1];
  const expectedHexArg = flags["--codeHash"] ?? flags["codeHash"] ?? posExpected;
  const pubkeyHexArg = flags["--pubkey"] ?? flags["pubkey"] ?? posPubkey;
  const expected = expectedHexArg ?? "0".repeat(64);
  const pubkey = pubkeyHexArg ?? ("02" + "0".repeat(64));
  const { digest, oracleConfigId } = await createOracleConfig(expected, pubkey);
  console.log("create_config digest:", digest);
  console.log("ORACLE_CONFIG_ID:", oracleConfigId);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
