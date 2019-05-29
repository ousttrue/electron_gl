import { describe, it } from "mocha";
import { assert } from "chai";
import * as path from "path";
import * as fs from "fs";
import { AssertionError } from "assert";
import { TextDecoder } from 'util';
import * as glb from "../src/glb";
import * as gltf from "../src/gltf";

describe('glb parser', () => {
    it('parse duck', () => {
        const duckPath = path.join(__dirname, "../samples/Duck/glTF-Binary/Duck.glb")
        const data = fs.readFileSync(duckPath);
        const [gltf_bin, bin] = glb.parseGlb(new DataView(data.buffer));

        assert.instanceOf(gltf_bin, Uint8Array);
        assert.instanceOf(bin, Uint8Array);

        const gltf_json = new TextDecoder('utf-8').decode(gltf_bin);
        const gltf_value = <gltf.Gltf>JSON.parse(gltf_json);
        assert.equal(gltf_value.asset.version, "2.0");
        assert.equal(gltf_value.meshes.length,  1);

        const mesh = gltf_value.meshes[0];
        assert.equal(mesh.primitives.length, 1);

        const primitive = mesh.primitives[0];
        assert.equal(gltf_value.accessors.length, 4); // pos, normal, uv + index

        const index_accessor = gltf_value.accessors[0];
        assert.equal(index_accessor.componentType, gltf.ComponentType.UNSIGNED_SHORT);
        assert.equal(index_accessor.type, gltf.ValueType.SCALAR);
    });
})