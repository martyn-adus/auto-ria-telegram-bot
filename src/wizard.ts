import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { wizardStatePath } from "./config.js";
import type { WizardStore } from "./types.js";

export function loadWizardState(): WizardStore {
  if (!existsSync(wizardStatePath)) return {};
  const raw = readFileSync(wizardStatePath, "utf-8");
  return raw.trim() ? (JSON.parse(raw) as WizardStore) : {};
}

export function saveWizardState(state: WizardStore): void {
  writeFileSync(wizardStatePath, JSON.stringify(state, null, 2) + "\n", "utf-8");
}
