import { describe, it } from "mocha";
import * as glb from "../src/glb";
import { assert } from "chai";
import * as path from "path";
import * as fs from "fs";

describe('glb parser', () => {
    it('parse duck', () => {
        const duckPath = path.join(__dirname, "../samples/Duck/glTF-Binary/Duck.glb")
        const data = fs.readFileSync(duckPath);
        const [gltf_bin, bin] = glb.parseGlb(new DataView(data.buffer));

        assert.instanceOf(gltf_bin, Uint8Array);
        assert.instanceOf(bin, Uint8Array);
    });
})