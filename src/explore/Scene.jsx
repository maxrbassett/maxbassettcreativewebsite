import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { KeyboardControls, useGLTF, useAnimations, Sky, Grid } from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import Ecctrl, { useGame } from 'ecctrl'

/* ------------------------------------------------------------------
 * STEP 1 SPIKE SCENE
 * A flat platform + the real Quaternius character with walk/run/idle/
 * jump driven by ecctrl. This is intentionally a gray-box: no biomes
 * or islands yet — the only goal is to prove movement feels good on
 * desktop AND mobile before we invest in art.
 * ------------------------------------------------------------------ */

const characterURL = '/models/character.glb'

// Maps ecctrl's required animation slots → the actual clip names inside
// the Quaternius Adventurer GLB (verified by inspecting the file).
// All slots MUST map to an EXISTING clip or ecctrl throws "cannot read
// properties of undefined". The Adventurer has no jump clips, so the
// jump/fall slots reuse the neutral idle pose (jumping still works
// physically — there's just no dedicated jump animation).
const animationSet = {
  idle: 'CharacterArmature|Idle',
  walk: 'CharacterArmature|Run', // always-run: walk state reuses the Run clip
  run: 'CharacterArmature|Run',
  jump: 'CharacterArmature|Idle_Neutral',
  jumpIdle: 'CharacterArmature|Idle_Neutral',
  jumpLand: 'CharacterArmature|Idle',
  fall: 'CharacterArmature|Idle_Neutral',
  action1: 'CharacterArmature|Wave',
  action2: 'CharacterArmature|Interact',
  action3: 'CharacterArmature|Roll',
  action4: 'CharacterArmature|Sword_Slash',
}

// drei KeyboardControls preset — these named actions are what ecctrl reads.
const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['Shift'] },
  { name: 'action1', keys: ['KeyE'] },
]

function CharacterModel(props) {
  const { scene } = useGLTF(characterURL)

  // Clone the skeleton so this instance owns its own rig. Rendering the
  // shared cached scene directly leaves the animation mixer bound to a
  // detached object under React StrictMode → no animation plays. A clone
  // fixes that (standard pattern for animated R3F characters).
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene])

  // Skinned meshes need castShadow set per-mesh, and frustumCulled off so
  // the character doesn't pop out of view when the bounding box is stale.
  useEffect(() => {
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.frustumCulled = false
      }
    })
  }, [model])

  return (
    <group {...props}>
      <primitive object={model} />
    </group>
  )
}

useGLTF.preload(characterURL)

/* ------------------------------------------------------------------
 * CharacterAnimation — a drop-in replacement for ecctrl's
 * EcctrlAnimation that additionally scales walk/run playback to the
 * character's real ground speed, so the legs keep pace with the body
 * (no foot-sliding). It reads ecctrl's shared animation state from
 * useGame, just like the stock component does.
 *
 * RUN_STRIDE_K: higher = faster legs. The character always runs, so this
 * is the single locomotion cadence knob.
 * ------------------------------------------------------------------ */
const RUN_STRIDE_K = 0.15

function CharacterAnimation({ characterURL, animationSet, children }) {
  const group = useRef(null)
  const { animations } = useGLTF(characterURL)
  const { actions } = useAnimations(animations, group)

  const curAnimation = useGame((s) => s.curAnimation)
  const resetAnimation = useGame((s) => s.reset)
  const initializeAnimationSet = useGame((s) => s.initializeAnimationSet)

  useEffect(() => {
    initializeAnimationSet(animationSet)
  }, [])

  // Play the current clip (mirrors EcctrlAnimation: one-shot clips clamp
  // and reset to idle when finished; locomotion clips loop).
  useEffect(() => {
    const key = curAnimation ?? animationSet.jumpIdle
    const action = key ? actions[key] : null
    if (!action) return

    const oneShot = [
      animationSet.jump,
      animationSet.jumpLand,
      animationSet.action1,
      animationSet.action2,
      animationSet.action3,
      animationSet.action4,
    ].includes(curAnimation)

    if (oneShot) {
      action.reset().fadeIn(0.2).setLoop(THREE.LoopOnce, 0).play()
      action.clampWhenFinished = true
    } else {
      action.reset().fadeIn(0.2).play()
    }

    // resetAnimation is a stable zustand action, so add/remove pair up.
    action._mixer.addEventListener('finished', resetAnimation)
    return () => {
      action.fadeOut(0.2)
      action._mixer.removeEventListener('finished', resetAnimation)
    }
  }, [curAnimation])

  // Measure world-space horizontal speed each frame and retime the legs.
  const prevPos = useRef(new THREE.Vector3())
  const worldPos = useRef(new THREE.Vector3())
  const started = useRef(false)
  useFrame((_, delta) => {
    if (!group.current || delta <= 0) return
    group.current.getWorldPosition(worldPos.current)
    if (!started.current) {
      prevPos.current.copy(worldPos.current)
      started.current = true
      return
    }
    const dx = worldPos.current.x - prevPos.current.x
    const dz = worldPos.current.z - prevPos.current.z
    const speed = Math.hypot(dx, dz) / delta
    prevPos.current.copy(worldPos.current)

    // Always-run: the walk and run states both resolve to the Run clip.
    const run = actions[animationSet.run]
    if (run && (curAnimation === animationSet.run || curAnimation === animationSet.walk)) {
      run.timeScale = THREE.MathUtils.clamp(speed * RUN_STRIDE_K, 0.8, 3.6)
    }
  })

  return (
    <group ref={group} dispose={null} userData={{ camExcludeCollision: true }}>
      {children}
    </group>
  )
}

// Temporary gray-box landmarks so movement/turning is legible against the
// empty plane (and to test collision). These get replaced by real island
// props later. Each y is size/2 so the block sits on the ground.
const LANDMARKS = [
  { pos: [6, 1, -4], size: [1.5, 2, 1.5], color: '#F05A1A' },
  { pos: [-7, 0.75, 3], size: [1.5, 1.5, 1.5], color: '#3a7bd5' },
  { pos: [3, 1.25, 8], size: [2, 2.5, 2], color: '#f4c542' },
  { pos: [-5, 1, -8], size: [1, 2, 1], color: '#9b5de5' },
  { pos: [11, 0.9, 6], size: [1.8, 1.8, 1.8], color: '#2ec4b6' },
]

function Landmarks() {
  return LANDMARKS.map((it, i) => (
    <RigidBody key={i} type="fixed" colliders="cuboid" position={it.pos}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={it.size} />
        <meshStandardMaterial color={it.color} />
      </mesh>
    </RigidBody>
  ))
}

export default function Scene() {
  return (
    <>
      <Sky sunPosition={[40, 25, 30]} turbidity={6} rayleigh={1.2} />
      <ambientLight intensity={0.7} />
      {/* Named "followLight" so ecctrl's followLight prop keeps shadows
          centered on the character as it moves around. */}
      <directionalLight
        name="followLight"
        position={[20, 30, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />

      {/* Reference grid so motion is readable on the flat plane. */}
      <Grid
        position={[0, 0.02, 0]}
        args={[80, 80]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#6f9e6a"
        sectionSize={5}
        sectionThickness={1.1}
        sectionColor="#3f6b3a"
        fadeDistance={55}
        fadeStrength={1}
        infiniteGrid={false}
      />

      <Physics timeStep="vary">
        <KeyboardControls map={keyboardMap}>
          <Landmarks />
          <Ecctrl
            animated
            followLight
            floatHeight={0.3}
            position={[0, 2, 0]}
            // Always run at the former sprint speed (4 × default sprint 2).
            maxVelLimit={8}
            sprintMult={1}
            // Keep the camera behind the character as it turns (RPG feel).
            mode="FixedCamera"
            // Follow-camera: angled down from above, moderately close.
            camInitDis={-6}
            camMaxDis={-10}
            camMinDis={-2}
            camInitDir={{ x: 0.2, y: 0 }}
          >
            <CharacterAnimation characterURL={characterURL} animationSet={animationSet}>
              <CharacterModel position={[0, -0.94, 0]} scale={0.95} />
            </CharacterAnimation>
          </Ecctrl>

          {/* Ground platform (gray-box). colliders={false} + explicit
              CuboidCollider keeps the physics shape simple and cheap. */}
          <RigidBody type="fixed" colliders={false}>
            <mesh receiveShadow position={[0, -0.05, 0]}>
              <boxGeometry args={[80, 0.1, 80]} />
              <meshStandardMaterial color="#a7d8a0" />
            </mesh>
            <CuboidCollider args={[40, 0.05, 40]} />
          </RigidBody>
        </KeyboardControls>
      </Physics>
    </>
  )
}
