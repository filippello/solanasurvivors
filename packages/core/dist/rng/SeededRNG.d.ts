export declare class SeededRNG {
    private seed;
    constructor(seed: number);
    /** Returns a float in [0, 1) */
    next(): number;
    /** Returns an int in [min, max] inclusive */
    nextInt(min: number, max: number): number;
    /** Pick a random element from an array */
    pick<T>(arr: T[]): T;
    /** Shuffle an array in place */
    shuffle<T>(arr: T[]): T[];
}
//# sourceMappingURL=SeededRNG.d.ts.map