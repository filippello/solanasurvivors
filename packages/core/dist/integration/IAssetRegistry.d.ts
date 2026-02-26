export interface IAssetRegistry {
    getOwnedSkins(): Promise<string[]>;
    getActiveSkin(): string | null;
    setActiveSkin(skinId: string): void;
}
//# sourceMappingURL=IAssetRegistry.d.ts.map