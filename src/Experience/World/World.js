
import Experience from "../Experience.js"
import Environment from "./Environment.js"

import Morphing from "./Examples/Morphing.js"
import Procedural from "./Examples/Procedural.js"
import HalfTone from "./Examples/HalfTone.js"



export default class World {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.debug = this.experience.debug
        this.camera = this.experience.camera

        /**
         * Debug folder
         */

        this.debugFolder = this.debug.ui.addFolder('Examples')

        const change0 = () => {
            this.destroy()
            this.Procedural = new Procedural()
            this.camera.instance.position.set(0, 1, -12)
            this.camera.instance.lookAt(0, 2, 0)
        }

        const change1 = () => {
            this.destroy()
            this.HalfTone = new HalfTone()
        }

        const change2 = () => {
            this.destroy()
            this.Morphing = new Morphing()
        }

        this.bug = {
            change0: change0,
            change1: change1,
            change2: change2,
        }

        this.debugFolder.add(this.bug, 'change0').name('Procedural world')
        this.debugFolder.add(this.bug, 'change1').name('HalfTone shading')
        this.debugFolder.add(this.bug, 'change2').name('Morphing')


        /**
         * Resources
         */

        this.resources.on('ready', () => {
            // Setup
            this.environment = new Environment()
            this.Morphing = new Morphing()

        })
    
        
    }

    destroy() {
        if(this.Morphing) {
            this.Morphing.destroy()
            this.Morphing = null
        }
        if(this.Procedural) {
            this.Procedural.destroy()
            this.Procedural = null
        }
        if(this.HalfTone) {
            this.HalfTone.destroy()
            this.HalfTone = null
        }
    }
    

    update() {
        if(this.Morphing) {
            this.Morphing.update()
        }
        if(this.Procedural) {
            this.Procedural.update()
        }
        if(this.HalfTone) {
            this.HalfTone.update()
        }
    }
}