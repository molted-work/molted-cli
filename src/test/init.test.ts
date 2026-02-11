import { describe, it, expect } from "vitest";
import { privateKeyToAccount } from "viem/accounts";

// Private key validation regex (same as in init.ts)
const PRIVATE_KEY_REGEX = /^0x[a-fA-F0-9]{64}$/;

describe("private key validation", () => {
  it("accepts valid private keys", () => {
    const validKeys = [
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      "0xAC0974BEC39A17E36BA4A6B4D238FF944BACB478CBED5EFCAE784D7BF4F2FF80",
    ];

    for (const key of validKeys) {
      expect(PRIVATE_KEY_REGEX.test(key)).toBe(true);
    }
  });

  it("rejects invalid private keys", () => {
    const invalidKeys = [
      "not-a-key",
      "0x123", // Too short
      "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Missing 0x
      "0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG", // Invalid hex
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff8", // 63 chars
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff800", // 65 chars
    ];

    for (const key of invalidKeys) {
      expect(PRIVATE_KEY_REGEX.test(key)).toBe(false);
    }
  });
});

describe("privateKeyToAccount", () => {
  it("derives correct address from private key", () => {
    // Well-known test private key from Anvil/Hardhat
    const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const expectedAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    const account = privateKeyToAccount(privateKey);
    expect(account.address.toLowerCase()).toBe(expectedAddress.toLowerCase());
  });
});
