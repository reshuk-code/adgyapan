import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';

function GoldShard({ position, scale, rotation, speed }) {
    const mesh = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (mesh.current) {
            mesh.current.rotation.x = rotation[0] + Math.cos(t / 4) * speed;
            mesh.current.rotation.y = rotation[1] + Math.sin(t / 4) * speed;
            mesh.current.rotation.z = rotation[2] + Math.sin(t / 2) * speed;
            mesh.current.position.y = position[1] + Math.sin(t / 2) * 0.1;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh ref={mesh} position={position} scale={scale} rotation={rotation}>
                <octahedronGeometry args={[1, 0]} />
                <meshPhysicalMaterial
                    color="#D4AF37"
                    metalness={1}
                    roughness={0.05}
                    emissive="#2a1b00"
                    emissiveIntensity={0.5}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                    reflectivity={1}
                    sheen={1}
                    sheenBlur={0.2}
                    sheenColor="#FFD700"
                />
            </mesh>
        </Float>
    );
}

function Scene() {
    const { viewport, mouse } = useThree();
    const group = useRef();

    const shards = useMemo(() => {
        return Array.from({ length: 35 }, () => ({
            position: [
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 8
            ],
            scale: Math.random() * 0.3 + 0.1,
            rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
            speed: Math.random() * 0.15 + 0.05
        }));
    }, []);

    useFrame(() => {
        if (group.current) {
            group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, mouse.y * 0.15, 0.03);
            group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, -mouse.x * 0.15, 0.03);
        }
    });

    return (
        <group ref={group}>
            <Environment preset="city" />
            <ambientLight intensity={0.2} />
            <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={3} color="#FFD700" castShadow />
            <pointLight position={[-10, -10, -10]} intensity={1.5} color="#FFFFFF" />

            {shards.map((props, i) => (
                <GoldShard key={i} {...props} />
            ))}
        </group>
    );
}

export default function LuxuryBackground() {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, background: '#000' }}>
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <Scene />
            </Canvas>
        </div>
    );
}
