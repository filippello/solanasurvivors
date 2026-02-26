export const WEAPON_TABLE = {
    magic_bolt: [
        { level: 1, damage: 10, cooldown: 1000, projectiles: 1, speed: 150, pierce: 0 },
        { level: 2, damage: 12, cooldown: 900, projectiles: 1, speed: 160, pierce: 0 },
        { level: 3, damage: 15, cooldown: 800, projectiles: 2, speed: 170, pierce: 0 },
        { level: 4, damage: 18, cooldown: 700, projectiles: 2, speed: 180, pierce: 1 },
        { level: 5, damage: 22, cooldown: 600, projectiles: 3, speed: 200, pierce: 1 },
    ],
    knife_fan: [
        { level: 1, damage: 8, cooldown: 1200, projectiles: 3, speed: 175, pierce: 0, extra: { spread: 0.4 } },
        { level: 2, damage: 10, cooldown: 1100, projectiles: 3, speed: 185, pierce: 0, extra: { spread: 0.45 } },
        { level: 3, damage: 12, cooldown: 1000, projectiles: 5, speed: 195, pierce: 0, extra: { spread: 0.5 } },
        { level: 4, damage: 14, cooldown: 900, projectiles: 5, speed: 205, pierce: 1, extra: { spread: 0.55 } },
        { level: 5, damage: 17, cooldown: 800, projectiles: 7, speed: 215, pierce: 1, extra: { spread: 0.6 } },
    ],
    orbit_aura: [
        { level: 1, damage: 5, cooldown: 500, projectiles: 1, speed: 0, pierce: 999, extra: { radius: 40, orbits: 2 } },
        { level: 2, damage: 7, cooldown: 450, projectiles: 1, speed: 0, pierce: 999, extra: { radius: 45, orbits: 2 } },
        { level: 3, damage: 9, cooldown: 400, projectiles: 1, speed: 0, pierce: 999, extra: { radius: 50, orbits: 3 } },
        { level: 4, damage: 12, cooldown: 350, projectiles: 1, speed: 0, pierce: 999, extra: { radius: 55, orbits: 3 } },
        { level: 5, damage: 15, cooldown: 300, projectiles: 1, speed: 0, pierce: 999, extra: { radius: 60, orbits: 4 } },
    ],
    chain_lightning: [
        { level: 1, damage: 12, cooldown: 1500, projectiles: 1, speed: 0, pierce: 0, extra: { chains: 2, chainRange: 60 } },
        { level: 2, damage: 15, cooldown: 1400, projectiles: 1, speed: 0, pierce: 0, extra: { chains: 3, chainRange: 70 } },
        { level: 3, damage: 18, cooldown: 1300, projectiles: 1, speed: 0, pierce: 0, extra: { chains: 4, chainRange: 80 } },
        { level: 4, damage: 22, cooldown: 1200, projectiles: 1, speed: 0, pierce: 0, extra: { chains: 5, chainRange: 90 } },
        { level: 5, damage: 28, cooldown: 1000, projectiles: 1, speed: 0, pierce: 0, extra: { chains: 7, chainRange: 100 } },
    ],
    bomb_toss: [
        { level: 1, damage: 25, cooldown: 2000, projectiles: 1, speed: 100, pierce: 0, extra: { blastRadius: 40 } },
        { level: 2, damage: 30, cooldown: 1800, projectiles: 1, speed: 110, pierce: 0, extra: { blastRadius: 45 } },
        { level: 3, damage: 36, cooldown: 1600, projectiles: 2, speed: 120, pierce: 0, extra: { blastRadius: 50 } },
        { level: 4, damage: 42, cooldown: 1400, projectiles: 2, speed: 130, pierce: 0, extra: { blastRadius: 55 } },
        { level: 5, damage: 50, cooldown: 1200, projectiles: 3, speed: 140, pierce: 0, extra: { blastRadius: 60 } },
    ],
    drone_summon: [
        { level: 1, damage: 6, cooldown: 800, projectiles: 1, speed: 125, pierce: 0, extra: { droneCount: 1, droneOrbitRadius: 50 } },
        { level: 2, damage: 8, cooldown: 700, projectiles: 1, speed: 135, pierce: 0, extra: { droneCount: 1, droneOrbitRadius: 55 } },
        { level: 3, damage: 10, cooldown: 600, projectiles: 1, speed: 145, pierce: 0, extra: { droneCount: 2, droneOrbitRadius: 60 } },
        { level: 4, damage: 13, cooldown: 500, projectiles: 1, speed: 155, pierce: 1, extra: { droneCount: 2, droneOrbitRadius: 65 } },
        { level: 5, damage: 16, cooldown: 400, projectiles: 1, speed: 165, pierce: 1, extra: { droneCount: 3, droneOrbitRadius: 70 } },
    ],
};
//# sourceMappingURL=weapons.js.map