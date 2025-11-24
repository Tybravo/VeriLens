import { enableDevMint } from "../oracle/enableDevMint";

const main = async () => {
  const { digest, devMintCapId } = await enableDevMint();
  console.log("enable_dev_mint digest:", digest);
  console.log("DEV_MINT_CAP_ID:", devMintCapId);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

