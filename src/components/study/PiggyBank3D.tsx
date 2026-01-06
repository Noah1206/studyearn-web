'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// 떨어지는 동전 (무한 루프)
function FallingCoin({
  initialPosition,
  delay,
  speed = 1,
  size = 0.15
}: {
  initialPosition: [number, number, number];
  delay: number;
  speed?: number;
  size?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [startTime] = useState(() => Date.now() + delay * 1000);
  const startY = 4;
  const endY = -3;

  useFrame(() => {
    if (!meshRef.current) return;

    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed < 0) return;

    // 무한 루프 애니메이션
    const duration = 3 / speed;
    const progress = (elapsed % duration) / duration;

    // 위에서 아래로 떨어지기
    meshRef.current.position.y = startY - progress * (startY - endY);

    // 회전
    meshRef.current.rotation.x = elapsed * 2;
    meshRef.current.rotation.z = elapsed * 1.5;

    // 페이드 효과
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    if (progress < 0.1) {
      material.opacity = progress * 10;
    } else if (progress > 0.9) {
      material.opacity = (1 - progress) * 10;
    } else {
      material.opacity = 1;
    }
  });

  return (
    <mesh ref={meshRef} position={[initialPosition[0], startY, initialPosition[2]]}>
      <cylinderGeometry args={[size, size, size * 0.3, 32]} />
      <meshStandardMaterial
        color="#FFD700"
        metalness={0.9}
        roughness={0.1}
        transparent
        opacity={0}
      />
    </mesh>
  );
}

// 떨어지는 동전들 그룹
function FallingCoinsGroup() {
  const coins = useMemo(() => {
    const result = [];
    for (let i = 0; i < 25; i++) {
      result.push({
        id: i,
        position: [
          (Math.random() - 0.5) * 6,
          0,
          (Math.random() - 0.5) * 4,
        ] as [number, number, number],
        delay: Math.random() * 3,
        speed: 0.8 + Math.random() * 0.4,
        size: 0.1 + Math.random() * 0.1,
      });
    }
    return result;
  }, []);

  return (
    <group>
      {coins.map((coin) => (
        <FallingCoin
          key={coin.id}
          initialPosition={coin.position}
          delay={coin.delay}
          speed={coin.speed}
          size={coin.size}
        />
      ))}
    </group>
  );
}

// 귀여운 돼지저금통 캐릭터 (토스 스타일)
function CutePiggy({ fillLevel }: { fillLevel: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHappy, setIsHappy] = useState(false);

  // 채워진 정도에 따라 행복해짐
  useEffect(() => {
    setIsHappy(fillLevel > 0.5);
  }, [fillLevel]);

  // 귀여운 움직임
  useFrame((state) => {
    if (groupRef.current) {
      // 통통 튀는 효과
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      // 살짝 기울기
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
    }
  });

  // 그라데이션 느낌의 색상
  const bodyColor = useMemo(() => {
    // 핑크에서 연핑크로
    return fillLevel > 0.5 ? '#FF9EAA' : '#FFB5C0';
  }, [fillLevel]);

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
      <group ref={groupRef} scale={1.3}>
        {/* 메인 몸체 - 동그란 형태 */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial
            color={bodyColor}
            metalness={0.1}
            roughness={0.4}
          />
        </mesh>

        {/* 볼터치 - 왼쪽 */}
        <mesh position={[-0.6, -0.1, 0.7]}>
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshStandardMaterial
            color="#FF6B8A"
            metalness={0}
            roughness={0.5}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* 볼터치 - 오른쪽 */}
        <mesh position={[0.6, -0.1, 0.7]}>
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshStandardMaterial
            color="#FF6B8A"
            metalness={0}
            roughness={0.5}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* 코 */}
        <mesh position={[0, -0.1, 0.95]}>
          <sphereGeometry args={[0.28, 32, 32]} />
          <meshStandardMaterial color="#FF8DA1" metalness={0.1} roughness={0.5} />
        </mesh>

        {/* 콧구멍 - 왼쪽 */}
        <mesh position={[-0.08, -0.12, 1.2]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#E75480" />
        </mesh>

        {/* 콧구멍 - 오른쪽 */}
        <mesh position={[0.08, -0.12, 1.2]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#E75480" />
        </mesh>

        {/* 눈 - 왼쪽 */}
        <group position={[-0.35, 0.25, 0.85]}>
          {/* 눈 흰자 */}
          <mesh>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          {/* 눈동자 */}
          <mesh position={[0, 0, 0.1]}>
            <sphereGeometry args={[0.08, 32, 32]} />
            <meshStandardMaterial color="#2D2D2D" />
          </mesh>
          {/* 하이라이트 */}
          <mesh position={[0.03, 0.03, 0.15]}>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.5} />
          </mesh>
        </group>

        {/* 눈 - 오른쪽 */}
        <group position={[0.35, 0.25, 0.85]}>
          <mesh>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 0, 0.1]}>
            <sphereGeometry args={[0.08, 32, 32]} />
            <meshStandardMaterial color="#2D2D2D" />
          </mesh>
          <mesh position={[0.03, 0.03, 0.15]}>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.5} />
          </mesh>
        </group>

        {/* 행복한 표정 - 눈썹 (채워지면 행복) */}
        {isHappy && (
          <>
            <mesh position={[-0.35, 0.45, 0.9]} rotation={[0, 0, 0.2]}>
              <boxGeometry args={[0.15, 0.03, 0.01]} />
              <meshStandardMaterial color="#2D2D2D" />
            </mesh>
            <mesh position={[0.35, 0.45, 0.9]} rotation={[0, 0, -0.2]}>
              <boxGeometry args={[0.15, 0.03, 0.01]} />
              <meshStandardMaterial color="#2D2D2D" />
            </mesh>
          </>
        )}

        {/* 귀 - 왼쪽 */}
        <group position={[-0.55, 0.75, 0.2]} rotation={[0, 0, -0.3]}>
          <mesh>
            <coneGeometry args={[0.2, 0.35, 32]} />
            <meshStandardMaterial color={bodyColor} />
          </mesh>
          {/* 귀 안쪽 */}
          <mesh position={[0, -0.05, 0.05]}>
            <coneGeometry args={[0.1, 0.2, 32]} />
            <meshStandardMaterial color="#FF8DA1" />
          </mesh>
        </group>

        {/* 귀 - 오른쪽 */}
        <group position={[0.55, 0.75, 0.2]} rotation={[0, 0, 0.3]}>
          <mesh>
            <coneGeometry args={[0.2, 0.35, 32]} />
            <meshStandardMaterial color={bodyColor} />
          </mesh>
          <mesh position={[0, -0.05, 0.05]}>
            <coneGeometry args={[0.1, 0.2, 32]} />
            <meshStandardMaterial color="#FF8DA1" />
          </mesh>
        </group>

        {/* 동전 투입구 */}
        <mesh position={[0, 0.95, 0]} rotation={[0, 0, Math.PI / 2]}>
          <RoundedBox args={[0.08, 0.4, 0.06]} radius={0.02}>
            <meshStandardMaterial color="#4A4A4A" metalness={0.8} roughness={0.2} />
          </RoundedBox>
        </mesh>

        {/* 동전 투입구 테두리 */}
        <mesh position={[0, 0.98, 0]} rotation={[0, 0, Math.PI / 2]}>
          <RoundedBox args={[0.05, 0.45, 0.08]} radius={0.02}>
            <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.1} />
          </RoundedBox>
        </mesh>

        {/* 꼬리 */}
        <group position={[0, 0.1, -0.95]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <torusGeometry args={[0.12, 0.04, 16, 32, Math.PI * 1.5]} />
            <meshStandardMaterial color={bodyColor} />
          </mesh>
        </group>

        {/* 다리 4개 */}
        {[
          [-0.45, -0.85, 0.35],
          [0.45, -0.85, 0.35],
          [-0.45, -0.85, -0.35],
          [0.45, -0.85, -0.35],
        ].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]}>
            <cylinderGeometry args={[0.12, 0.14, 0.25, 16]} />
            <meshStandardMaterial color="#FF8DA1" />
          </mesh>
        ))}

        {/* 쌓인 동전 표시 (채워진 정도) */}
        <group position={[0, -0.3, 0]}>
          {Array.from({ length: Math.floor(fillLevel * 5) }).map((_, i) => (
            <mesh
              key={i}
              position={[
                Math.sin(i * 1.2) * 0.2,
                -0.4 + i * 0.08,
                Math.cos(i * 1.2) * 0.2
              ]}
              rotation={[Math.random() * 0.3, Math.random() * Math.PI, 0]}
            >
              <cylinderGeometry args={[0.12, 0.12, 0.04, 32]} />
              <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>
      </group>
    </Float>
  );
}

// 반짝이는 별 파티클
function Sparkle({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [scale, setScale] = useState(1);

  useFrame((state) => {
    if (meshRef.current) {
      // 반짝이는 효과
      const t = state.clock.elapsedTime + position[0] * 10;
      meshRef.current.scale.setScalar(0.5 + Math.sin(t * 3) * 0.3);
      meshRef.current.rotation.z = t * 2;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <octahedronGeometry args={[0.05]} />
      <meshStandardMaterial
        color="#FFE066"
        emissive="#FFD700"
        emissiveIntensity={2}
      />
    </mesh>
  );
}

// 반짝이 그룹
function SparklesGroup() {
  const sparkles = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3,
      ] as [number, number, number],
    }));
  }, []);

  return (
    <group>
      {sparkles.map((s) => (
        <Sparkle key={s.id} position={s.position} />
      ))}
    </group>
  );
}

// 진행률 원형 게이지
function ProgressArc({ progress }: { progress: number }) {
  const arcRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (arcRef.current) {
      // 은은한 빛나는 효과
      const intensity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      (arcRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
    }
  });

  return (
    <group position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
      {/* 배경 원 */}
      <mesh>
        <torusGeometry args={[1.3, 0.05, 16, 64]} />
        <meshStandardMaterial color="#FFE4E9" transparent opacity={0.5} />
      </mesh>

      {/* 진행률 원 */}
      <mesh ref={arcRef}>
        <torusGeometry args={[1.3, 0.08, 16, 64, Math.PI * 2 * progress]} />
        <meshStandardMaterial
          color="#FF6B8A"
          emissive="#FF6B8A"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

// 메인 씬
function Scene({
  elapsedMinutes,
  goalMinutes,
}: {
  elapsedMinutes: number;
  goalMinutes: number;
}) {
  const fillLevel = Math.min(1, elapsedMinutes / goalMinutes);

  return (
    <>
      {/* 조명 설정 - 밝고 부드러운 느낌 */}
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        color="#FFFFFF"
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#FFB5C0" />
      <pointLight position={[5, 3, 5]} intensity={0.3} color="#FFD700" />

      {/* 떨어지는 동전들 */}
      <FallingCoinsGroup />

      {/* 메인 캐릭터 */}
      <CutePiggy fillLevel={fillLevel} />

      {/* 반짝이 효과 */}
      <SparklesGroup />

      {/* 진행률 표시 */}
      <ProgressArc progress={fillLevel} />

      {/* 환경 설정 */}
      <Environment preset="city" />
    </>
  );
}

// 메인 컴포넌트
export default function PiggyBank3D({
  elapsedMinutes = 0,
  goalMinutes = 120,
  className,
}: {
  elapsedMinutes?: number;
  goalMinutes?: number;
  className?: string;
}) {
  return (
    <div className={`relative ${className || ''}`}>
      {/* 그라데이션 배경 */}
      <div
        className="absolute inset-0 rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #FFF5F7 0%, #FFE4E9 30%, #FFDDE4 60%, #FFD4DC 100%)',
        }}
      >
        {/* 구름 장식 - 왼쪽 위 */}
        <div
          className="absolute top-4 left-4 w-16 h-8 opacity-60"
          style={{
            background: 'radial-gradient(ellipse, white 0%, transparent 70%)',
            filter: 'blur(4px)',
          }}
        />
        {/* 구름 장식 - 오른쪽 위 */}
        <div
          className="absolute top-8 right-8 w-20 h-10 opacity-50"
          style={{
            background: 'radial-gradient(ellipse, white 0%, transparent 70%)',
            filter: 'blur(6px)',
          }}
        />
        {/* 하단 언덕 느낌 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1/4 opacity-40"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, #FFB5C0 100%)',
            borderRadius: '50% 50% 0 0',
          }}
        />
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0.5, 5], fov: 45 }}
        style={{
          background: 'transparent',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Scene elapsedMinutes={elapsedMinutes} goalMinutes={goalMinutes} />
      </Canvas>

      {/* CSS 떨어지는 동전 오버레이 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-coin-fall"
            style={{
              left: `${10 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <div
              className="w-4 h-4 rounded-full animate-spin-slow"
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                boxShadow: '0 2px 8px rgba(255, 215, 0, 0.5)',
              }}
            />
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes coin-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100%) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotateY(0deg);
          }
          to {
            transform: rotateY(360deg);
          }
        }

        .animate-coin-fall {
          animation: coin-fall linear infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
