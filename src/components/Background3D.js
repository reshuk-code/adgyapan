import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function ParticleField(props) {
    const ref = useRef();
    const { viewport, mouse } = useThree();

    // Generate random particles
    const positions = useMemo(() => {
        const count = 2000;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10; // x
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10; // y
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10; // z
        }
        return positions;
    }, []);

    useFrame((state, delta) => {
        if (ref.current) {
            // Constant rotation
            ref.current.rotation.x -= delta / 10;
            ref.current.rotation.y -= delta / 15;

            // Mouse interaction
            const x = (state.mouse.x * viewport.width) / 50;
            const y = (state.mouse.y * viewport.height) / 50;
            ref.current.rotation.x += y * 0.1;
            ref.current.rotation.y += x * 0.1;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={positions} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color="#7928ca"
                    size={0.02}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </Points>
        </group>
    );
}

export default function Background3D() {
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.6 }}>
            <Canvas camera={{ position: [0, 0, 3] }}>
                <ParticleField />
            </Canvas>
        </div>
    );
}
