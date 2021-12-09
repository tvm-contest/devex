export type Config = {
    readonly mongodb: string;
    readonly ton: {
        readonly tonUrls: string[];
        readonly colRoot: string;

        readonly swiftAddress: string;
        readonly swiftUpdateIntervalMs: number;
    };
};
