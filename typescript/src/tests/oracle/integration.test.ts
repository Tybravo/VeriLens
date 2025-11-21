import { ENV } from "../../env";

describe("oracle integration (guarded)", () => {
  const hasNetwork = Boolean(ENV.SUI_NETWORK && ENV.USER_SECRET_KEY);
  test(hasNetwork ? "env present" : "skip: env missing", () => {
    expect(typeof ENV.SUI_NETWORK).toBe(hasNetwork ? "string" : "undefined");
  });
});
