/// https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#glb-file-format-specification

import { Gltf } from "./gltf"


interface Chunk {
    type: number;
    body: Uint8Array;
}

function readChunk(view: DataView, pos: number): [Chunk, number] {
    const length = view.getUint32(pos, true); pos += 4;
    const chunkType = view.getUint32(pos, true); pos += 4;
    const body = new Uint8Array(view.buffer, pos, length);
    return [{ type: chunkType, body: body }, pos + length];
}

export function parseGlb(view: DataView): [Uint8Array, Uint8Array] {
    let pos = 0;

    const magic = view.getUint32(pos, true); pos += 4;
    if (magic != 0x46546C67) {
        throw new Error("invalid magic");
    }

    const version = view.getUint32(pos, true); pos += 4;
    if (version != 2) {
        throw new Error(`unknown version: ${version}`);
    }

    const length = view.getUint32(pos, true); pos += 4;

    let firstChunk: Chunk;
    [firstChunk, pos] = readChunk(view, pos);
    if (firstChunk.type != 0x4E4F534A) {
        throw new Error('first chunk is not JSON');
    }

    let secondChunk: Chunk;
    [secondChunk, pos] = readChunk(view, pos);
    if (secondChunk.type != 0x004E4942) {
        throw new Error('second chunk is not BIN');
    }

    if (pos != length) {
        throw new Error(`not match length ${pos} with ${length}`);
    }

    return [firstChunk.body, secondChunk.body];
}
