import { describe, it } from "mocha";
import { assert, expect } from "chai";
import * as path from "path";
import * as fs from "fs";
// import { AssertionError } from "assert";
import { TextDecoder } from 'util';
import * as glb from "../src/glb";
import * as gltf from "../src/gltf";
import * as interfaces from "../src/interfaces";


function decode(src: Uint8Array): string {
    return new TextDecoder('utf-8').decode(src);
}

describe('glb parser', () => {
    it('parse duck', () => {
        const duckPath = path.join(__dirname, "../samples/Duck/glTF-Binary/Duck.glb")
        const data = fs.readFileSync(duckPath);
        const [gltf_bin, bin] = glb.parseGlb(new DataView(data.buffer));
        assert.instanceOf(gltf_bin, Uint8Array);
        assert.instanceOf(bin, Uint8Array);

        const gltf_json = decode(gltf_bin);

        {
            const gltf_value = <gltf.Gltf>JSON.parse(gltf_json);
            assert.equal(gltf_value.asset.version, "2.0");
            assert.equal(gltf_value.meshes.length, 1);

            const mesh = gltf_value.meshes[0];
            assert.equal(mesh.primitives.length, 1);

            const primitive = mesh.primitives[0];
            assert.equal(gltf_value.accessors.length, 4); // pos, normal, uv + index
            assert.equal(gltf_value.bufferViews.length, 4); // pos, normal, uv + index
            assert.equal(gltf_value.buffers.length, 1); // pos, normal, uv + index

            const index_accessor = gltf_value.accessors[0];
            assert.equal(index_accessor.componentType, gltf.ComponentType.UNSIGNED_SHORT);
            assert.equal(index_accessor.type, gltf.ValueType.SCALAR);

            const buffer_view = gltf_value.bufferViews[0];

            const buffer = gltf_value.buffers[0];
            assert.equal(buffer.byteLength, 118342);
        }

        {
            const loadData: interfaces.LoadData = {
                url: "",
                json: gltf_json,
                bin: bin
            };
            const model = interfaces.LoadDataToModel(loadData);
            assert.instanceOf(model.indices, Uint16Array);
            assert.equal(12636, model.indices.length);
            assert.equal(0, model.indices[0]);
            assert.equal(1, model.indices[1]);
            assert.equal(2, model.indices[2]);
            expect(model.vertices[interfaces.Semantics.POSITION].values[0]).to.be.closeTo(-23.93640, 1e-5); // x
            expect(model.vertices[interfaces.Semantics.POSITION].values[1]).to.be.closeTo(11.53530, 1e-5); // x
            expect(model.vertices[interfaces.Semantics.POSITION].values[2]).to.be.closeTo(30.61250, 1e-5); // x
        }
    });
})
