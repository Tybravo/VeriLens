import { publishPackage } from "../oracle/publishPackage";

const main = async () => {
  const { digest, packageId } = await publishPackage();
  console.log("publish digest:", digest);
  console.log("packageId:", packageId);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

