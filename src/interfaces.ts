export interface LoadModel {
    url: string;
    data: Buffer;
}

export interface VertexAttribute
{
    elementCount: number; // 1, 2, 3, 4
    values: number[];
}

export interface Model {
    indices: number[],
    vertices: {[attribute: string]: VertexAttribute}
}
