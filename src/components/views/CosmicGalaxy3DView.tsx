import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Person } from '../../types/network';
import { Sparkles, Info } from 'lucide-react';

interface CosmicGalaxy3DViewProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
}

export const CosmicGalaxy3DView: React.FC<CosmicGalaxy3DViewProps> = ({
  people,
  onSelectPerson
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPerson, setHoveredPerson] = useState<Person | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 650;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070e);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 80, 220);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    container.appendChild(renderer.domElement);

    // 2. Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const centerPointLight = new THREE.PointLight(0x818cf8, 2.5, 500);
    centerPointLight.position.set(0, 0, 0);
    scene.add(centerPointLight);

    // 3. 우주 배경 별빛 파티클 필드 (Starfield)
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 1200;
      starPositions[i + 1] = (Math.random() - 0.5) * 1200;
      starPositions[i + 2] = (Math.random() - 0.5) * 1200;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 1.5,
      transparent: true,
      opacity: 0.6
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 4. 중심 항성 '나 (Me)' 노드
    const centerGeo = new THREE.SphereGeometry(7, 32, 32);
    const centerMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      emissive: 0x4338ca,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const centerMesh = new THREE.Mesh(centerGeo, centerMat);
    scene.add(centerMesh);

    // 궤도 가이드 링 (Orbit Circles)
    const orbitRadii = [60, 110, 160];
    orbitRadii.forEach(r => {
      const ringGeo = new THREE.RingGeometry(r - 0.3, r + 0.3, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x312e81,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      scene.add(ringMesh);
    });

    // 5. 인맥 행성 노드들 배치
    const nodeMeshes: THREE.Mesh[] = [];
    const candidates = people.filter(p => p.closeness !== 1);

    candidates.forEach((person, idx) => {
      // 궤도 반지름: 친밀도 또는 DART 팩트 여부에 따라 분배
      let radius = 60;
      if (person.closeness === 2) radius = 60;
      else if (person.closeness === 3) radius = 110;
      else radius = 160;

      const angle = (idx / candidates.length) * Math.PI * 2 + (Math.random() * 0.2);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 35; // 상하 고저차

      const nodeSize = person.dartInfo ? 4.2 : 3.0;
      const sphereGeo = new THREE.SphereGeometry(nodeSize, 24, 24);

      // 색상: DART 검증은 에메랄드, 일반은 블루/퍼플
      const nodeColor = person.dartInfo ? 0x10b981 : 0x3b82f6;
      const sphereMat = new THREE.MeshStandardMaterial({
        color: nodeColor,
        emissive: nodeColor,
        emissiveIntensity: 0.4,
        roughness: 0.3
      });

      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.set(x, y, z);
      mesh.userData = { person };

      scene.add(mesh);
      nodeMeshes.push(mesh);

      // 연결선 (나 -> 인맥 엣지)
      const lineMat = new THREE.LineBasicMaterial({
        color: person.dartInfo ? 0x059669 : 0x4338ca,
        transparent: true,
        opacity: 0.25
      });
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, y, z)
      ]);
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
    });

    // 6. 마우스 인터랙션 & 360 궤도 회전
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotationSpeed = 0.002;
    let orbitAngle = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / height) * 2 + 1;

      // 레이캐스팅 호버 감지
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        const target = intersects[0].object.userData.person as Person;
        setHoveredPerson(target);
        container.style.cursor = 'pointer';
      } else {
        setHoveredPerson(null);
        container.style.cursor = isDragging ? 'grabbing' : 'grab';
      }

      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        camera.position.x += deltaX * 0.4;
        camera.position.y -= deltaY * 0.4;
        camera.lookAt(0, 0, 0);

        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        const target = intersects[0].object.userData.person as Person;
        onSelectPerson(target);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.2;
      camera.position.z = Math.min(Math.max(camera.position.z + zoomDelta, 80), 500);
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('click', onClick);
    container.addEventListener('wheel', onWheel);

    // 7. 60fps 애니메이션 렌더 루프
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // 항성 자전
      centerMesh.rotation.y += 0.01;

      // 은하수 미세 자동 자전
      if (!isDragging) {
        orbitAngle += rotationSpeed;
        starField.rotation.y += 0.0003;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 정리 핸들러
    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('click', onClick);
      container.removeEventListener('wheel', onWheel);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [people, onSelectPerson]);

  return (
    <div className="relative w-full h-[650px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Three.js 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Control Badge */}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur shadow-lg text-xs">
        <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
        <span className="font-bold text-white">3D Cosmic Orbit Mode (Three.js)</span>
        <span className="text-[10px] text-slate-400 hidden sm:inline">· 마우스 드래그 360° 회전 · 휠 줌</span>
      </div>

      {/* 범례 */}
      <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur shadow-lg text-[11px] space-y-1.5">
        <div className="font-semibold text-slate-300 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-indigo-400" /> 우주 성단 범례
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500" />
            <span>중심 항성 (나/Me)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
            <span>🏛️ DART FACT 임원</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>📇 일반 인맥 행성</span>
          </div>
        </div>
      </div>

      {/* 3D 노드 호버 팝업 카드 */}
      {hoveredPerson && (
        <div className="absolute top-4 right-4 p-4 rounded-xl bg-slate-900/95 border border-indigo-500/50 backdrop-blur shadow-2xl max-w-xs space-y-1 animate-in fade-in duration-150 pointer-events-none">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-white">{hoveredPerson.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
              클릭하여 상세 정보
            </span>
          </div>
          <p className="text-xs text-indigo-400 font-medium">
            {hoveredPerson.currentCompany} · {hoveredPerson.currentTitle}
          </p>
          <p className="text-[11px] text-slate-400">
            {hoveredPerson.primaryDomain} ({hoveredPerson.estimatedAgeGroup})
          </p>
          {hoveredPerson.dartInfo && (
            <p className="text-[10px] text-emerald-400">🏛️ DART 상장사 공시 확인</p>
          )}
        </div>
      )}
    </div>
  );
};
