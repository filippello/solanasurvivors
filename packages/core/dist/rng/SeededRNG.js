export class SeededRNG {
    constructor(seed) {
        this.seed = seed;
    }
    /** Returns a float in [0, 1) */
    next() {
        // mulberry32
        this.seed |= 0;
        this.seed = (this.seed + 0x6d2b79f5) | 0;
        let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    /** Returns an int in [min, max] inclusive */
    nextInt(min, max) {
        return min + Math.floor(this.next() * (max - min + 1));
    }
    /** Pick a random element from an array */
    pick(arr) {
        return arr[Math.floor(this.next() * arr.length)];
    }
    /** Shuffle an array in place */
    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}
//# sourceMappingURL=SeededRNG.js.map