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
        const gltf_value = <gltf.Gltf>JSON.parse(gltf_json);
        assert.equal(gltf_value.asset.version, "2.0");
        assert.equal(gltf_value.meshes.length, 1);

        const mesh = gltf_value.meshes[0];
        assert.equal(mesh.primitives.length, 1);

        const primitive = mesh.primitives[0];
        assert.equal(gltf_value.accessors.length, 4); // pos, normal, uv + index
        assert.equal(gltf_value.bufferViews.length, 4); // pos, normal, uv + index
        assert.equal(gltf_value.buffers.length, 1); // pos, normal, uv + index

        {
            const index_accessor = gltf_value.accessors[0];
            assert.equal(index_accessor.componentType, gltf.GltfComponentType.UNSIGNED_SHORT);
            assert.equal(index_accessor.type, gltf.GltfValueType.SCALAR);

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
            const model = interfaces.LoadDataToModel(gltf_value, mesh, primitive, loadData.bin);
            assert.instanceOf(model.indices, Uint16Array);
            assert.equal(12636, model.indices.length);
            assert.equal(0, model.indices[0]);
            assert.equal(1, model.indices[1]);
            assert.equal(2, model.indices[2]);
            expect(model.vertices[gltf.GltfVertexAttributeSemantics.POSITION].values[0]).to.be.closeTo(-23.93640, 1e-5); // x
            expect(model.vertices[gltf.GltfVertexAttributeSemantics.POSITION].values[1]).to.be.closeTo(11.53530, 1e-5); // x
            expect(model.vertices[gltf.GltfVertexAttributeSemantics.POSITION].values[2]).to.be.closeTo(30.61250, 1e-5); // x
        }
    });
})

describe('gltf primitive has shared buffer ?', () => {

    it('duck', () => {
        const gltf_path = path.join(__dirname, "../samples/Duck/glTF-Binary/Duck.glb")
        const data = fs.readFileSync(gltf_path);
        const [gltf_bin, bin] = glb.parseGlb(new DataView(data.buffer));
        const gltf_json = decode(gltf_bin);
        const gltf_value = <gltf.Gltf>JSON.parse(gltf_json);

        const mesh0 = gltf_value.meshes[0];
        assert.isTrue(gltf.hasSharedVertexBuffer(mesh0));
    });

    it('buggy', () => {
        const gltf_path = path.join(__dirname, "../samples/Buggy/glTF/Buggy.gltf")
        const gltf_bin = fs.readFileSync(gltf_path);
        const gltf_json = decode(gltf_bin);
        const gltf_value = <gltf.Gltf>JSON.parse(gltf_json);

        for (let i = 0; i < gltf_value.meshes.length; ++i) {
            const mesh = gltf_value.meshes[i];
            if (mesh.primitives.length > 1) {
                //console.log(i, mesh.primitives);
                assert.isFalse(gltf.hasSharedVertexBuffer(mesh));
            }
            else {
                assert.isTrue(gltf.hasSharedVertexBuffer(mesh));
            }
        }
    });

    it('shared', () => {
        const mesh: gltf.GltfMesh = {
            primitives: [
                {
                    indices: 0,
                    attributes: {
                        POSITION: 1,
                    },
                    material: 0
                },
                {
                    indices: 1,
                    attributes: {
                        POSITION: 1,
                    },
                    material: 0
                }
            ]
        };

        assert.isTrue(gltf.hasSharedVertexBuffer(mesh));
    });
})
