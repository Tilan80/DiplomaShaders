
import * as THREE from 'three'
import Experience from '../../Experience.js'

import CustomShaderMaterial from 'three-custom-shader-material/vanilla'

import terrainVertexShader from './Shaders/Procedural/vertex.glsl'
import terrainFragmentShader from './Shaders/Procedural/fragment.glsl'

export default class Procedural {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.debug = this.experience.debug

        this.time = this.experience.time

        // Debug
        this.debugObject = {}
        this.debugObject.colorWaterDeep = '#002b3d'
        this.debugObject.colorWaterSurface = '#66a8ff'
        this.debugObject.colorSand = '#ffe894'
        this.debugObject.colorGrass = '#85d534'
        this.debugObject.colorSnow = '#ffffff'
        this.debugObject.colorRock = '#bfbd8d'

        // Setup
        this.setTerrain()
        this.setWater()
        this.setDebug()
    }

    setTerrain() {
        // Geometry
        this.terrainGeometry = new THREE.PlaneGeometry(20, 20, 1000, 1000)
        this.terrainGeometry.deleteAttribute('uv')
        this.terrainGeometry.deleteAttribute('normal')
        this.terrainGeometry.rotateX(-Math.PI * 0.5)

        // Material uniforms
        this.uniforms = {
            uTime: { value: 0 },
            uPositionFrequency: { value: 0.2 },
            uStrength: { value: 2.0 },
            uWarpFrequency: { value: 5 },
            uWarpStrength: { value: 0.5 },
            uColorWaterDeep: { value: new THREE.Color(this.debugObject.colorWaterDeep) },
            uColorWaterSurface: { value: new THREE.Color(this.debugObject.colorWaterSurface) },
            uColorSand: { value: new THREE.Color(this.debugObject.colorSand) },
            uColorGrass: { value: new THREE.Color(this.debugObject.colorGrass) },
            uColorSnow: { value: new THREE.Color(this.debugObject.colorSnow) },
            uColorRock: { value: new THREE.Color(this.debugObject.colorRock) },
        }

        // Material
        this.terrainMaterial = new CustomShaderMaterial({
            // CSM
            baseMaterial: THREE.MeshStandardMaterial,
            vertexShader: terrainVertexShader,
            fragmentShader: terrainFragmentShader,
            uniforms: this.uniforms,

            // MeshStandardMaterial
            metalness: 0,
            roughness: 0.5,
            color: '#85d543',
        })

        // Create depth material for shadows
        this.depthMaterial = new CustomShaderMaterial({
            // CSM
            baseMaterial: THREE.MeshDepthMaterial,
            vertexShader: terrainVertexShader,
            fragmentShader: terrainFragmentShader,
            uniforms: this.uniforms,

            //MeshStandardMaterial
            depthPacking: THREE.RGBADepthPacking,
        })

        // Create mesh
        this.terrain = new THREE.Mesh(this.terrainGeometry, this.terrainMaterial)
        this.terrain.customDepthMaterial = this.depthMaterial
        this.terrain.receiveShadow = true
        this.terrain.castShadow = true
        this.scene.add(this.terrain)
    }

    setWater() {
        // Water geometry and material
        this.waterGeometry = new THREE.PlaneGeometry(10, 10, 1, 1)
        this.waterMaterial = new THREE.MeshPhysicalMaterial({
            transmission: 1,
            roughness: 0.3,
        })

        // Create water mesh
        this.water = new THREE.Mesh(this.waterGeometry, this.waterMaterial)
        this.water.rotation.x = -Math.PI * 0.5
        this.water.position.y = -0.1
        this.scene.add(this.water)
    }

    setDebug() {
        this.debugFolder = this.debug.ui.addFolder('Terrain')

        this.debugFolder.add(this.uniforms.uPositionFrequency, 'value')
            .min(0).max(1).step(0.001)
            .name('position frequency')

        this.debugFolder.add(this.uniforms.uStrength, 'value')
            .min(0).max(10).step(0.001)
            .name('strength')

        this.debugFolder.add(this.uniforms.uWarpFrequency, 'value')
            .min(0).max(100).step(0.001)
            .name('warp frequency')

        this.debugFolder.add(this.uniforms.uWarpStrength, 'value')
            .min(0).max(1).step(0.0001)
            .name('warp strength')

        this.debugFolder.addColor(this.debugObject, 'colorWaterDeep')
            .onChange(() => this.uniforms.uColorWaterDeep.value.set(this.debugObject.colorWaterDeep))

        this.debugFolder.addColor(this.debugObject, 'colorWaterSurface')
            .onChange(() => this.uniforms.uColorWaterSurface.value.set(this.debugObject.colorWaterSurface))

        this.debugFolder.addColor(this.debugObject, 'colorSand')
            .onChange(() => this.uniforms.uColorSand.value.set(this.debugObject.colorSand))

        this.debugFolder.addColor(this.debugObject, 'colorGrass')
            .onChange(() => this.uniforms.uColorGrass.value.set(this.debugObject.colorGrass))

        this.debugFolder.addColor(this.debugObject, 'colorSnow')
            .onChange(() => this.uniforms.uColorSnow.value.set(this.debugObject.colorSnow))

        this.debugFolder.addColor(this.debugObject, 'colorRock')
            .onChange(() => this.uniforms.uColorRock.value.set(this.debugObject.colorRock))

    }

    update() {
        // Update uniforms with time
        if (this.uniforms) {
            this.uniforms.uTime.value = this.time.elapsed * 0.001
        }
    }

    destroy() {
        // Remove meshes from scene
        this.scene.remove(this.terrain)
        this.scene.remove(this.water)

        // Dispose geometries
        this.terrainGeometry.dispose()
        this.waterGeometry.dispose()

        // Dispose materials
        this.terrainMaterial.dispose()
        this.depthMaterial.dispose()
        this.waterMaterial.dispose()

        // Dispose debug folder
        this.debugFolder.destroy()
    }

}