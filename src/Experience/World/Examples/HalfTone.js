
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

        this.models = this.resources.items.morphingModels

        this.time = this.experience.time

        // Material
        this.materialParameters = {}
        this.materialParameters.color = '#ff794d'
        this.materialParameters.shadowColor = '#8e19b8'
        this.materialParameters.lightColor = '#e5ffe0'

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
        this.debugFolder = this.debug.ui.addFolder('HalfTone')
        // this.debugFolder
        //     .addColor(rendererParameters, 'clearColor')
        //     .onChange(() => {
        //         renderer.setClearColor(rendererParameters.clearColor)
        //     })

        this.debugFolder
            .addColor(this.materialParameters, 'color')
            .onChange(() => {
                this.material.uniforms.uColor.value.set(this.materialParameters.color)
            })

        this.debugFolder
            .add(this.material.uniforms.uShadowRepetitions, 'value')
            .min(1)
            .max(300)
            .step(1)

        this.debugFolder
            .addColor(this.materialParameters, 'shadowColor')
            .onChange(() => {
                this.material.uniforms.uShadowColor.value.set(this.materialParameters.shadowColor)
            })

        this.debugFolder
            .add(this.material.uniforms.uLightRepetitions, 'value')
            .min(1)
            .max(300)
            .step(1)

        this.debugFolder
            .addColor(this.materialParameters, 'lightColor')
            .onChange(() => {
                this.material.uniforms.uLightColor.value.set(this.materialParameters.lightColor)
            })

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