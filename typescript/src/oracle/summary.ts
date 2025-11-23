import { ENV } from "../env";

export const printOracleIdsSummary = () => {
  const summary = {
    packageId: ENV.PACKAGE_ID,
    oracleConfigId: (ENV as any).ORACLE_CONFIG_ID,
    devMintCapId: (ENV as any).DEV_MINT_CAP_ID,
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(summary, null, 2));
};

