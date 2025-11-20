import { createOracleConfig } from "../oracle/createConfig";

const main = async () => {
  const [expectedHexArg, pubkeyHexArg] = process.argv.slice(2);
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

