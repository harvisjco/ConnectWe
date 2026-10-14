/**
 * Three.js WebGL GPU 자원 재귀 클린업 유틸리티 (ThreeDisposer)
 * 
 * 구글 수석 아키텍트 & 성능 헌장 준수:
 * 1. Scene, Mesh, Points, Line 등 Object3D의 geometry, material, texture 완전 해제
 * 2. 다중 재질(Material Array) 및 텍스처 맵의 재귀적 .dispose() 보장
 * 3. 탭 전환 및 3D 뷰 언마운트 시 WebGL VRAM 누수(Memory Leak) 원천 차단
 */

import * as THREE from 'three';

export function disposeThreeObject(obj: THREE.Object3D): void {
  if (!obj) return;

  // 자식 노드 재귀 순회
  while (obj.children.length > 0) {
    const child = obj.children[0];
    disposeThreeObject(child);
    obj.remove(child);
  }

  // Mesh 또는 Points 또는 Line
  if ('geometry' in obj) {
    const mesh = obj as { geometry?: THREE.BufferGeometry };
    if (mesh.geometry && typeof mesh.geometry.dispose === 'function') {
      mesh.geometry.dispose();
    }
  }

  if ('material' in obj) {
    const mesh = obj as { material?: THREE.Material | THREE.Material[] };
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(mat => disposeMaterial(mat));
    } else if (mesh.material) {
      disposeMaterial(mesh.material);
    }
  }
}

function disposeMaterial(mat: THREE.Material): void {
  if (!mat) return;

  // 텍스처 속성 탐색 및 해제
  const matAny = mat as unknown as Record<string, unknown>;
  const textureKeys = ['map', 'lightMap', 'bumpMap', 'normalMap', 'specularMap', 'envMap', 'alphaMap', 'aoMap', 'displacementMap', 'emissiveMap', 'metalnessMap', 'roughnessMap'];
  
  for (const key of textureKeys) {
    const val = matAny[key];
    if (val && typeof (val as { dispose?: () => void }).dispose === 'function') {
      (val as { dispose: () => void }).dispose();
    }
  }

  mat.dispose();
}

/**
 * 씬 전체 클린업
 */
export function disposeThreeScene(scene: THREE.Scene, renderer?: THREE.WebGLRenderer): void {
  if (!scene) return;
  disposeThreeObject(scene);

  if (renderer) {
    renderer.dispose();
    if (renderer.forceContextLoss) {
      renderer.forceContextLoss();
    }
  }
}
