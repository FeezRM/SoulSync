"use client"; // Ensure it runs only on client-side

import * as THREE from "three";
import { useRef, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

export default function Avatar({ audioUrl, stopAudio }) {
  const avatarRef = useRef();
  const audioRef = useRef(null);

  // Load GLB Model
  function Model() {
    const { scene } = useGLTF("/upper-body.glb");

    // Adjust model position & scale (shoulders & up)
    scene.position.set(0, -1.5, 2.5); // Moves model closer
    scene.rotation.set(0, Math.PI, 0); // Faces correct way
    scene.scale.set(2.0, 2.0, 2.0); // Enlarges model

    return <primitive object={scene} ref={avatarRef} />;
  }

  // Preload GLTF model to avoid loading delay
  useGLTF.preload("/upper-body.glb");

  // Sync AI speech with avatar movement
  useEffect(() => {
    if (audioUrl) {
      playAudioWithLipSync(audioUrl);
    }
  }, [audioUrl]);

  function playAudioWithLipSync(audioUrl) {
    const audio = new Audio(audioUrl);
    audioRef.current = audio; // Store audio instance for stopping later

    const phonemeTimings = [
      { phoneme: "A", time: 0.1 },
      { phoneme: "O", time: 0.3 },
      { phoneme: "E", time: 0.5 },
    ];

    audio.onplay = () => {
      phonemeTimings.forEach(({ phoneme, time }) => {
        setTimeout(() => {
          triggerLipSync(phoneme);
        }, time * 1000);
      });
    };

    audio.play();
  }

  function triggerLipSync(phoneme) {
    if (!avatarRef.current) return;
    const morphs = avatarRef.current.children[0]?.morphTargetInfluences;

    if (morphs) {
      if (phoneme === "A") morphs[0] = 1.0;
      if (phoneme === "O") morphs[1] = 1.0;

      setTimeout(() => {
        morphs[0] = 0;
        morphs[1] = 0;
      }, 100);
    }
  }

  // Stops the AI voice when "End Session" is clicked
  function stopVoice() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }

  return (
    <div className="avatar-box">
      <Canvas camera={{ position: [0, 0, 3] }}>
        <Suspense fallback={<p>Loading...</p>}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 5, 5]} />
          <Model />
          <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2.2} maxPolarAngle={Math.PI / 2.2} />
        </Suspense>
      </Canvas>
    </div>
  );
}