import { updateOracleConfig } from "../oracle/updateConfig";

const main = async () => {
  const [expectedHexArg, pubkeyHexArg] = process.argv.slice(2);
  if (!expectedHexArg || !pubkeyHexArg) {
    console.error("Usage: npm run oracle:update-config -- <expected_code_hash_hex> <trusted_pubkey_hex>");
    process.exit(1);
  }
  const { digest } = await updateOracleConfig(expectedHexArg, pubkeyHexArg);
  console.log("update_config digest:", digest);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

