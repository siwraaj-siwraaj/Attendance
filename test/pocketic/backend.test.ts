import { PocketIc } from "@dfinity/pic";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project: the last pre-EM revision, whose schema this
// app's migration chain replays from. Installing the current wasm onto an empty
// canister there traps IC0503 before any test runs.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

let pic: PocketIc | undefined;
let actor: _SERVICE;

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  if (BASELINE_WASM === undefined) {
    ({ actor } = await pic.setupCanister<_SERVICE>({ idlFactory, wasm: BACKEND_WASM }));
    return;
  }
  // `[baseline, current]`, the same install contract the hosted deploy uses for
  // a converted project. The upgrade replays the chain from the legacy schema.
  const installed = await pic.setupCanister<_SERVICE>({ idlFactory, wasm: BASELINE_WASM });
  await pic.upgradeCanister({ canisterId: installed.canisterId, wasm: BACKEND_WASM, arg: new Uint8Array() });
  actor = installed.actor;
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far. A failed
  // `PocketIc.create` otherwise stacks "Cannot read properties of undefined"
  // on top of the real error and buries the one line that explains the run.
  await pic?.tearDown();
});

describe("auth rework: username/password login with seeded admin", () => {
  it("answers an empty-state read instead of trapping", async () => {
    // The domain reads require a signed-in caller, so authenticate first.
    await actor.login({ username: "siwraaj", password: "74482" });
    await expect(actor.getContracts()).resolves.toEqual([]);
    await expect(actor.getLabours()).resolves.toEqual([]);
    await expect(actor.getAdvances()).resolves.toEqual([]);
    await expect(actor.getAllAttendance()).resolves.toEqual([]);
  });

  it("logs in the seeded admin with the documented credentials", async () => {
    const result = await actor.login({ username: "siwraaj", password: "74482" });
    expect(result).toEqual([
      { username: "siwraaj", role: { admin: null }, status: { approved: null } },
    ]);
    // The signed-in caller is the admin, so the admin-only panel is reachable.
    await expect(actor.getCallerRole()).resolves.toEqual([{ admin: null }]);
    await expect(actor.getCallerStatus()).resolves.toEqual({ approved: null });
  });

  it("rejects invalid credentials and leaves the caller signed out", async () => {
    await actor.logout();
    const result = await actor.login({ username: "siwraaj", password: "wrong" });
    expect(result).toEqual([]);
    await expect(actor.getCallerRole()).resolves.toEqual([]);
    await expect(actor.getCallerStatus()).resolves.toEqual({ pending: null });
  });

  it("lets the admin create a user who can then sign in", async () => {
    await actor.login({ username: "siwraaj", password: "74482" });
    const created = await actor.createUser("alice", "pw123", { attendanceOnly: null });
    expect(created).toBe(true);

    const users = await actor.listUsers();
    expect(users).toContainEqual(
      expect.objectContaining({
        username: "alice",
        role: { attendanceOnly: null },
        status: { approved: null },
      }),
    );

    // A second account with the same username is rejected.
    await expect(actor.createUser("alice", "other", { viewOnly: null })).resolves.toBe(false);

    // The new user can sign in with the credentials the admin set.
    await actor.logout();
    const aliceLogin = await actor.login({ username: "alice", password: "pw123" });
    expect(aliceLogin).toEqual([
      { username: "alice", role: { attendanceOnly: null }, status: { approved: null } },
    ]);
  });
});

describe("combined contract creation and attendance marking", () => {
  it("round-trips a contract through the real canister", async () => {
    await actor.login({ username: "siwraaj", password: "74482" });
    const added = await actor.addContract("Site A", 1.5, 100000, 2000, 5000, 3000, []);
    expect(added.ok).toBeDefined();
    const contractId = added.ok!.id;

    const contracts = await actor.getContracts();
    expect(contracts).toContainEqual(
      expect.objectContaining({ id: contractId, name: "Site A", multiplier: 1.5 }),
    );
  });

  it("adds a work column and marks attendance in one flow", async () => {
    await actor.login({ username: "siwraaj", password: "74482" });
    const added = await actor.addContract("Site B", 1.0, 50000, 1000, 2000, 1000, []);
    const contractId = added.ok!.id;

    const withColumn = await actor.addWorkColumn(contractId, "Brickwork", "masonry");
    expect(withColumn.ok).toBeDefined();
    const columnId = withColumn.ok!.workColumns[0].id;

    const labour = await actor.addLabour("Ravi", "E1", "2026-01-01");
    const labourId = labour.ok!.id;

    const marked = await actor.setAttendance(contractId, labourId, columnId, { present: null });
    expect(marked).toEqual({ ok: true });

    const attendance = await actor.getAttendance(contractId);
    expect(attendance).toContainEqual(
      expect.objectContaining({
        contractId,
        labourId,
        columnId,
        value: { present: null },
      }),
    );
  });
});
