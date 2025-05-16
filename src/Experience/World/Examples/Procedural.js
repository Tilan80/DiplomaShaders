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

        // Movement controls
        this.movement = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            speed: 0.05
        }

        // Terrain position
        this.terrainPosition = {
            x: 0,
            z: 0
        }

        this.terrainAnimationEnabled = false;

        // Debug
        this.debugObject = {}
        this.debugObject.colorWater = '#66a8ff'
        this.debugObject.colorWaterDeep = '#002b3d'
        this.debugObject.colorWaterSurface = '#eee581'
        this.debugObject.colorSand = '#ffe894'
        this.debugObject.colorGrass = '#85d534'
        this.debugObject.colorSnow = '#ffffff'
        this.debugObject.colorRock = '#bfbd8d'
        this.debugObject.fogColor = '#e8f0ff'
        this.debugObject.fogNear = 5.0
        this.debugObject.fogFar = 15.0
        this.debugObject.fogDensity = 0.03

        // Setup
        this.setTerrain()
        this.setWater()
        this.setDebug()
        this.setupKeyboardControls()
        this.createInstructionElement()
    }

    createInstructionElement() {
        // Create instruction element
        this.instructionElement = document.createElement('div')
        this.instructionElement.textContent = 'Use WASD to move'

        // Style the element
        Object.assign(this.instructionElement.style, {
            position: 'absolute',
            top: '20px',
            left: '20px',
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            fontWeight: 'bold',
            padding: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '5px',
            zIndex: '1000',
            pointerEvents: 'none' // Make sure it doesn't interfere with mouse events
        })

        // Add to DOM
        document.body.appendChild(this.instructionElement)
    }

    setupKeyboardControls() {
        // Add event listeners for keydown and keyup
        window.addEventListener('keydown', (event) => {
            switch (event.key.toLowerCase()) {
                case 'w':
                    this.movement.forward = true
                    break
                case 's':
                    this.movement.backward = true
                    break
                case 'a':
                    this.movement.left = true
                    break
                case 'd':
                    this.movement.right = true
                    break
            }
        })

        window.addEventListener('keyup', (event) => {
            switch (event.key.toLowerCase()) {
                case 'w':
                    this.movement.forward = false
                    break
                case 's':
                    this.movement.backward = false
                    break
                case 'a':
                    this.movement.left = false
                    break
                case 'd':
                    this.movement.right = false
                    break
            }
        })
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
            uTerrainAnimationTime: { value: 0 },
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
            uTerrainPosition: { value: new THREE.Vector2(0, 0) },
            uFogColor: { value: new THREE.Color(this.debugObject.fogColor) },
            uFogNear: { value: this.debugObject.fogNear },
            uFogFar: { value: this.debugObject.fogFar },
            uFogDensity: { value: this.debugObject.fogDensity }
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
        this.waterGeometry = new THREE.PlaneGeometry(20, 20, 100, 100);
        this.waterGeometry.rotateX(-Math.PI * 0.5);

        // Water uniforms
        this.waterUniforms = {
            uTime: { value: 0 },
            uWaveSpeed: { value: 1.0 },
            uWaveHeight: { value: 0.01 },
            uWaveFrequency: { value: 2.0 },
            uWaterColor: { value: new THREE.Color(this.debugObject.colorWater) },
            uWaterOpacity: { value: 0.7 }
        };

        // Create water material with custom shader
        this.waterMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                uniform float uTime;
                uniform float uWaveSpeed;
                uniform float uWaveHeight;
                uniform float uWaveFrequency;

                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying float vWaveHeight;

                void main() {
                    vUv = uv;
                    
                    // Create wave effect
                    vec3 pos = position;
                    float waveX = sin(pos.x * uWaveFrequency + uTime * uWaveSpeed) * uWaveHeight;
                    float waveZ = sin(pos.z * uWaveFrequency + uTime * uWaveSpeed) * uWaveHeight;
                    pos.y += waveX + waveZ;
                    
                    // Pass wave height to fragment shader for coloring
                    vWaveHeight = waveX + waveZ;
                    
                    // Calculate normal for lighting
                    vec3 tangent = normalize(vec3(1.0, cos(pos.x * uWaveFrequency + uTime * uWaveSpeed) * uWaveHeight * uWaveFrequency, 0.0));
                    vec3 bitangent = normalize(vec3(0.0, cos(pos.z * uWaveFrequency + uTime * uWaveSpeed) * uWaveHeight * uWaveFrequency, 1.0));
                    vNormal = normalize(cross(tangent, bitangent));
                    
                    vPosition = pos;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uWaterColor;
                uniform float uWaterOpacity;
                uniform float uTime;

                varying vec2 vUv;
                varying float vWaveHeight;

                void main() {
                    // Base water color from uniform
                    vec3 waterColor = uWaterColor;
                    
                    // Adjust brightness based on wave height
                    // Normalize the wave height to a range of -1 to 1
                    float normalizedHeight = vWaveHeight / 0.01; // Assuming max wave height is around 0.1
                    
                    // Make higher waves brighter, lower waves darker
                    waterColor = waterColor * (1.0 + normalizedHeight * 0.3);
                    
                    // Add very subtle ripple effect
                    float ripple = sin(vUv.x * 15.0 + uTime) * sin(vUv.y * 15.0 + uTime) * 0.02;
                    waterColor -= vec3(ripple);
                    
                    // Simple transparency
                    float opacity = uWaterOpacity;
                    
                    gl_FragColor = vec4(waterColor, opacity);
                }
            `,
            uniforms: this.waterUniforms,
            transparent: true,
            side: THREE.DoubleSide
        });

        // Create water mesh
        this.water = new THREE.Mesh(this.waterGeometry, this.waterMaterial);
        this.water.position.y = -0.1;
        this.scene.add(this.water);
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

        this.debugFolder.add(this.movement, 'speed')
            .min(0.01).max(0.2).step(0.01)
            .name('movement speed')

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

        this.debugFolder.addColor(this.debugObject, 'fogColor')
            .onChange(() => this.uniforms.uFogColor.value.set(this.debugObject.fogColor))
            .name('fog color')

        this.debugFolder.add(this.debugObject, 'fogNear', 0, 10, 0.1)
            .onChange(() => this.uniforms.uFogNear.value = this.debugObject.fogNear)
            .name('fog near')

        this.debugFolder.add(this.debugObject, 'fogFar', 5, 30, 0.1)
            .onChange(() => this.uniforms.uFogFar.value = this.debugObject.fogFar)
            .name('fog far')

        this.debugFolder.add(this.debugObject, 'fogDensity', 0, 0.1, 0.001)
            .onChange(() => this.uniforms.uFogDensity.value = this.debugObject.fogDensity)
            .name('fog density')
        
        // Water debug controls
        this.waterFolder = this.debugFolder.addFolder('Water');
        this.waterFolder.add(this.waterUniforms.uWaveHeight, 'value', 0, 0.2, 0.01).name('Wave Height');
        this.waterFolder.add(this.waterUniforms.uWaveSpeed, 'value', 0, 5, 0.1).name('Wave Speed');
        this.waterFolder.add(this.waterUniforms.uWaveFrequency, 'value', 0, 5, 0.1).name('Wave Frequency');
        this.waterFolder.add(this.waterUniforms.uWaterOpacity, 'value', 0, 1, 0.01).name('Opacity');
        this.waterFolder.addColor(this.debugObject, 'colorWater')
            .onChange(() => {
                this.waterUniforms.uWaterColor.value.set(this.debugObject.colorWater);
            })
            .name('Water Color');

    }

    update() {
        // Update terrain position based on keyboard input
        if (this.movement.forward) {
            this.terrainPosition.z += this.movement.speed
        }
        if (this.movement.backward) {
            this.terrainPosition.z -= this.movement.speed
        }
        if (this.movement.left) {
            this.terrainPosition.x += this.movement.speed
        }
        if (this.movement.right) {
            this.terrainPosition.x -= this.movement.speed
        }

        // Make sure this line is executing
        this.uniforms.uTerrainPosition.value.set(this.terrainPosition.x, this.terrainPosition.z)

        // Also update time for animation
        this.uniforms.uTime.value = this.time.elapsed * 0.001
        this.waterUniforms.uTime.value = this.time.elapsed * 0.001;
    }

    destroy() {
        // Remove event listeners
        window.removeEventListener('keydown', this.onKeyDown)
        window.removeEventListener('keyup', this.onKeyUp)

        // Remove instruction element
        if (this.instructionElement && this.instructionElement.parentNode) {
            this.instructionElement.parentNode.removeChild(this.instructionElement)
        }

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
