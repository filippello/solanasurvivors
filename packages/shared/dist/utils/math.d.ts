export interface Vec2 {
    x: number;
    y: number;
}
export declare function distance(a: Vec2, b: Vec2): number;
export declare function distanceSq(a: Vec2, b: Vec2): number;
export declare function normalize(v: Vec2): Vec2;
export declare function clamp(value: number, min: number, max: number): number;
export declare function angleBetween(a: Vec2, b: Vec2): number;
export declare function lerp(a: number, b: number, t: number): number;
export declare function randomPointOnCircle(cx: number, cy: number, radius: number, angle: number): Vec2;
//# sourceMappingURL=math.d.ts.map