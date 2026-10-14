import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { disposeThreeObject, disposeThreeScene } from '../threeDisposer';

describe('threeDisposer - Three.js WebGL GPU 자원 클린업 검증', () => {
  it('1. 메쉬의 geometry 및 material이 정상적으로 dispose 되어야 한다', () => {
    const geo = new THREE.BoxGeometry(10, 10, 10);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const geoDisposeSpy = vi.spyOn(geo, 'dispose');
    const matDisposeSpy = vi.spyOn(mat, 'dispose');

    const mesh = new THREE.Mesh(geo, mat);
    disposeThreeObject(mesh);

    expect(geoDisposeSpy).toHaveBeenCalledTimes(1);
    expect(matDisposeSpy).toHaveBeenCalledTimes(1);
  });

  it('2. Scene 내의 자식 노드들이 재귀적으로 순회되며 모두 제거 및 dispose 되어야 한다', () => {
    const scene = new THREE.Scene();

    const child1 = new THREE.Mesh(
      new THREE.SphereGeometry(5),
      new THREE.MeshBasicMaterial()
    );
    const child2 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 5),
      new THREE.MeshBasicMaterial()
    );

    scene.add(child1);
    scene.add(child2);
    expect(scene.children.length).toBe(2);

    disposeThreeScene(scene);
    expect(scene.children.length).toBe(0);
  });
});
