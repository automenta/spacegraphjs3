export declare const mockThree: {
    Scene: {
        new (): {
            children: any[];
            add: (obj: any) => number;
            remove: (obj: any) => void;
        };
    };
    PerspectiveCamera: {
        new (): {};
    };
    Vector3: {
        new (x?: number, y?: number, z?: number): {
            x: number;
            y: number;
            z: number;
            set(x: number, y: number, z: number): void;
            equals(v: any): boolean;
        };
    };
    Color: {
        new (hex: string | number): {
            hex: string | number;
            getHexString: () => string;
        };
    };
};
