
import * as THREE from 'three'
import Experience from '../../Experience.js'

import HalfToneVertexShader from './Shaders/HalfTone/vertex.glsl'
import HalfToneFragmentShader from './Shaders/HalfTone/fragment.glsl'

export default class HalfTone {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.debug = this.experience.debug

        this.width = this.experience.sizes.width
        this.height = this.experience.sizes.height
        this.pixelRatio = this.experience.sizes.pixelRatio

        this.time = this.experience.time

        // Material
        this.materialParameters = {}
        this.materialParameters.color = '#ff794d'
        this.materialParameters.shadowColor = '#8e19b8'
        this.materialParameters.lightColor = '#e5ffe0'
        this.materialParameters.rimColor = '#80ffff';

        this.materialParameters.patternType = 0; // Default to circle pattern
        this.materialParameters.shadingMode = 0; // 0 = halftone, 1 = cartoon

        this.materialParameters.toonLevels = 3;
        this.materialParameters.outlineWidth = 0.01;
        this.materialParameters.outlineColor = '#000000';


        this.material = new THREE.ShaderMaterial({
            vertexShader: HalfToneVertexShader,
            fragmentShader: HalfToneFragmentShader,
            uniforms: {
                uColor: { value: new THREE.Color(this.materialParameters.color) },
                uShadeColor: new THREE.Uniform(new THREE.Color(this.materialParameters.shadeColor)),
                uResolution: new THREE.Uniform(new THREE.Vector2(this.width * this.pixelRatio, this.height * this.pixelRatio)),
                uShadowRepetitions: new THREE.Uniform(100),
                uShadowColor: new THREE.Uniform(new THREE.Color(this.materialParameters.shadowColor)),
                uLightRepetitions: new THREE.Uniform(100),
                uLightColor: new THREE.Uniform(new THREE.Color(this.materialParameters.lightColor)),
                // New uniforms
                uRimStrength: new THREE.Uniform(0.2),
                uRimColor: new THREE.Uniform(new THREE.Color(this.materialParameters.rimColor)),
                uSpecularPower: new THREE.Uniform(100.0),
                uSpecularColor: new THREE.Uniform(new THREE.Color('#ffffff')),
                uPatternType: new THREE.Uniform(this.materialParameters.patternType),
                uShadingMode: new THREE.Uniform(this.materialParameters.shadingMode),
                uToonLevels: new THREE.Uniform(this.materialParameters.toonLevels),
                uOutlineWidth: new THREE.Uniform(this.materialParameters.outlineWidth),
                uOutlineColor: new THREE.Uniform(new THREE.Color(this.materialParameters.outlineColor)),
            }
        })


        // object
        this.torusKnot = new THREE.Mesh(
            new THREE.TorusKnotGeometry(1, 0.4, 100, 16),
            this.material
        )
        this.scene.add(this.torusKnot)

        this.setDebug()

    }

    setDebug() {
        this.debugFolder = this.debug.ui.addFolder('Toon')
        this.debugHalfTone = this.debug.ui.addFolder('Half Tone')
        this.debugToon = this.debug.ui.addFolder('Three tone shading')
        this.debugToon.close()

        this.debugFolder.add(this.materialParameters, 'shadingMode', { 'Halftone': 0, 'Cartoon': 1 })
            .onChange(() => {
                this.material.uniforms.uShadingMode.value = this.materialParameters.shadingMode;
                if (this.materialParameters.shadingMode == 0) {
                    this.debugToon.close()
                    this.debugHalfTone.open()
                } else {
                    this.debugToon.open()
                    this.debugHalfTone.close()
                }
            })
            .name('Shading Mode');

        this.debugFolder
            .addColor(this.materialParameters, 'color')
            .onChange(() => {
                this.material.uniforms.uColor.value.set(this.materialParameters.color)
            })
            .name('Main color')

        this.debugFolder
            .addColor(this.materialParameters, 'shadowColor')
            .onChange(() => {
                this.material.uniforms.uShadowColor.value.set(this.materialParameters.shadowColor)
            })
            .name('Shadow Color')


        // Debug half tone
        this.debugHalfTone
            .add(this.material.uniforms.uShadowRepetitions, 'value')
            .min(1)
            .max(300)
            .step(1)
            .name('Shadow Repetitions')

        this.debugHalfTone
            .addColor(this.materialParameters, 'lightColor')
            .onChange(() => {
                this.material.uniforms.uLightColor.value.set(this.materialParameters.lightColor)
            })
            .name('Light Color')

        this.debugHalfTone
            .add(this.material.uniforms.uLightRepetitions, 'value')
            .min(1)
            .max(300)
            .step(1)
            .name('Light Repetitions')

        this.debugHalfTone
            .addColor(this.materialParameters, 'rimColor')
            .onChange(() => {
                this.material.uniforms.uRimColor.value.set(this.materialParameters.rimColor)
            })
            .name('Rim Color')
        
        this.debugHalfTone
            .add(this.material.uniforms.uRimStrength, 'value')
            .min(0).max(1).step(0.01)
            .name('Rim Strength')
        
        this.debugHalfTone
            .add(this.material.uniforms.uSpecularPower, 'value')
            .min(1).max(128).step(1)
            .name('Specular Power')

        // Add pattern type selector
        this.debugHalfTone
            .add(this.material.uniforms.uPatternType, 'value', {
                'Circle': 0,
                'Diamond': 1,
                'Line': 2,
                'Flower': 3,
                'Cross': 4
            })
            .name('Pattern Type')



        // Add 3 tone shading
        this.debugToon.add(this.materialParameters, 'toonLevels', { '3 Tone': 3, '5 Tone': 5 })
            .onChange(() => {
                this.material.uniforms.uToonLevels.value = this.materialParameters.toonLevels;
            })
            .name('Toon Levels');

        this.debugToon.add(this.materialParameters, 'outlineWidth', 0, 1, 0.01)
            .onChange(() => {
                this.material.uniforms.uOutlineWidth.value = this.materialParameters.outlineWidth;
            })
            .name('Outline Width');

        this.debugToon.addColor(this.materialParameters, 'outlineColor')
            .onChange(() => {
                this.material.uniforms.uOutlineColor.value.set(this.materialParameters.outlineColor);
            })
            .name('Outline Color');


    }

    update() {
        this.torusKnot.rotation.y = this.time.elapsed * 0.0002
        this.torusKnot.rotation.x = this.time.elapsed * 0.0003
    }

    destroy() {
        this.debugFolder.destroy()

        // Remove mesh from scene
        this.scene.remove(this.torusKnot)

        // Dispose of geometry and material
        this.torusKnot.geometry.dispose()
        this.material.dispose()

        // Clear references
        this.torusKnot = null
        this.material = null
        this.materialParameters = null
    }
}