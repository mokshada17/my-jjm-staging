import { useAppStore } from "@/app/store";
import { stateInfo, type StateInfo } from "./states";

/** The state the officer has chosen (the breadcrumb root), from the app store. */
export function useActiveState(): StateInfo {
  return stateInfo(useAppStore((s) => s.activeState));
}
