import { RunResult } from '@solanasurvivors/shared';
export interface ISacrificeGate {
    canStartRun(): Promise<boolean>;
    submitRunResult(result: RunResult): Promise<void>;
}
//# sourceMappingURL=ISacrificeGate.d.ts.map