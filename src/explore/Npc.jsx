import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { useGLTF, useAnimations, Float, Html } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import { useExplore } from './useExplore'
import { NPC_POSITION, NPC_ROTATION_Y } from './worldLayout'

/* The welcome NPC ("Max") standing by spawn. Same Quaternius adventurer as the
 * player, recolored per-material (shirt blue, shorts tan, peach skin, brown
 * hair), idling by default and waving while talking. The dialogue is a speech
 * bubble anchored above his head (drei <Html>), reading the current line from
 * the store; advancing/closing is driven by InteractionOverlay (E) or a tap. */
const characterURL = '/models/character.glb'

// Recolor by the GLB's material names. Body = Green/LightGreen (shirt),
// Legs = Brown/Brown2 (shorts), Skin on body+head. Anything not listed keeps
// its original color (Hair is already brown; boots/eyes/gold unchanged).
const NPC_COLORS = {
  Green: '#34589c', // shirt
  LightGreen: '#4a73bd', // shirt highlight
  Brown: '#c3a878', // shorts
  Brown2: '#a98f62', // shorts (shadow)
  Skin: '#eab690', // peach
}

// The beard/mustache aren't separate meshes — they're part of the head's
// single Hair primitive — so we can't just hide them. Instead we clip the Hair
// material below this world Y, removing the facial hair while keeping the
// scalp. Tune up to cut more (e.g. the mustache), down to keep more sideburns.
// (Needs localClippingEnabled.)
const BEARD_CLIP_Y = 1.53
const BEARD_CLIP = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BEARD_CLIP_Y)

function NpcModel() {
  const group = useRef(null)
  const gl = useThree((s) => s.gl)
  const { scene, animations } = useGLTF(characterURL)

  // Local clipping must be enabled for the beard-clip plane to take effect.
  useEffect(() => {
    gl.localClippingEnabled = true
  }, [gl])

  // Clone the skeleton so this instance owns its rig; clone the materials we
  // touch (recolor / hide / clip) so the shared cached materials (used by the
  // player) are left untouched.
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene])
  useEffect(() => {
    model.traverse((o) => {
      // Hide the backpack (its own node) and everything under it.
      if (o.name === 'Backpack') {
        o.visible = false
        return
      }
      if (!o.isMesh) return
      o.castShadow = true
      o.frustumCulled = false
      if (o.material?.name === 'Hair') {
        // Clip the beard off the bottom of the hair mesh.
        o.material = o.material.clone()
        o.material.clippingPlanes = [BEARD_CLIP]
        o.material.clipShadows = true
        return
      }
      const hex = NPC_COLORS[o.material?.name]
      if (hex) {
        o.material = o.material.clone()
        o.material.color = new THREE.Color(hex)
      }
    })
  }, [model])

  // Idle by default; play a single Wave shortly after load, then again with a
  // 10s pause between waves (timer re-armed when each wave finishes).
  const { actions, mixer } = useAnimations(animations, group)
  useEffect(() => {
    const idle = actions['CharacterArmature|Idle']
    const wave = actions['CharacterArmature|Wave']
    if (!idle || !wave) return
    idle.play()

    let timer
    const playWave = () => {
      idle.fadeOut(0.3)
      wave.reset().setLoop(THREE.LoopOnce, 1).fadeIn(0.3).play()
    }
    const onFinished = (e) => {
      if (e.action !== wave) return
      wave.fadeOut(0.3)
      idle.reset().fadeIn(0.3).play()
      timer = setTimeout(playWave, 10000) // 10s pause between waves
    }
    mixer.addEventListener('finished', onFinished)
    timer = setTimeout(playWave, 600) // initial greeting wave

    return () => {
      clearTimeout(timer)
      mixer.removeEventListener('finished', onFinished)
    }
  }, [actions, mixer])

  return (
    <group ref={group} scale={0.95} dispose={null}>
      <primitive object={model} />
    </group>
  )
}

useGLTF.preload(characterURL)

function SpeechBubble({ npc, step, onAdvance }) {
  const last = step >= npc.lines.length - 1
  return (
    <Html position={[0, 1.7, 0]} center zIndexRange={[100, 0]}>
      <div className="explore-bubble" onClick={onAdvance}>
        <div className="explore-bubble__name">{npc.name}</div>
        <p className="explore-bubble__text">{npc.lines[step]}</p>
        <div className="explore-bubble__hint">{last ? 'E / tap to close' : 'E / tap to continue ▸'}</div>
      </div>
    </Html>
  )
}

export function Npc() {
  const active = useExplore((s) => s.active)
  const step = useExplore((s) => s.dialogueStep)
  const advance = useExplore((s) => s.advanceDialogue)
  const talking = active?.type === 'npc'

  return (
    <group position={NPC_POSITION} rotation={[0, NPC_ROTATION_Y, 0]}>
      <NpcModel />
      {talking ? (
        <SpeechBubble npc={active.npc} step={step} onAdvance={advance} />
      ) : (
        // Floating indicator so it reads as interactive, like the screens.
        <Float speed={3} floatIntensity={0.9} rotationIntensity={0.7}>
          <mesh position={[0, 3.2, 0]} castShadow>
            <octahedronGeometry args={[0.32, 0]} />
            <meshStandardMaterial color="#A46B44" emissive="#A46B44" emissiveIntensity={0.7} />
          </mesh>
        </Float>
      )}
    </group>
  )
}
