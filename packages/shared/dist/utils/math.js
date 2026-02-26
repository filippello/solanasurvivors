export function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}
export function distanceSq(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
}
export function normalize(v) {
    const len = Math.sqrt(v.x * v.x + v.y * v.y);
    if (len === 0)
        return { x: 0, y: 0 };
    return { x: v.x / len, y: v.y / len };
}
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
export function angleBetween(a, b) {
    return Math.atan2(b.y - a.y, b.x - a.x);
}
export function lerp(a, b, t) {
    return a + (b - a) * t;
}
export function randomPointOnCircle(cx, cy, radius, angle) {
    return {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
    };
}
//# sourceMappingURL=math.js.map