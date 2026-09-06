import type { createActorFunction } from "@caffeineai/core-infrastructure";
import { type Backend, createActor } from "../backend";

/**
 * Type adapter around the generated `createActor` so it satisfies the
 * `createActorFunction<Backend>` signature expected by `useActor`.
 *
 * The generated bindings type `CreateActorOptions.agent` with @icp-sdk/core's
 * Agent, while core-infrastructure's `createActorFunction` expects
 * @dfinity/agent's Agent. The two are structurally incompatible at the type
 * level, so we bridge them with a single boundary cast. The runtime object is
 * identical — only the declared option type differs.
 */
export const createBackendActor =
  createActor as unknown as createActorFunction<Backend>;
