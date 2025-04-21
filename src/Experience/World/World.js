
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

        /**
         * Debug folder
         */

        this.debugFolder = this.debug.ui.addFolder('Examples')

        const change0 = () => {
            this.destroy()
            this.Morphing = null
            this.HalfTone = null
            this.Procedural = new Procedural()
        }

        const change1 = () => {
            this.destroy()
            this.HalfTone = new HalfTone()
            this.Procedural = null
            this.Morphing = null
        }

        const change2 = () => {
            this.destroy()
            this.Morphing = new Morphing()
            this.Procedural = null
            this.HalfTone = null
        }

        this.bug = {
            change0: change0,
            change1: change1,
            change2: change2,
        }

        this.debugFolder.add(this.bug, 'change0')
        this.debugFolder.add(this.bug, 'change1')
        this.debugFolder.add(this.bug, 'change2')


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
        }
        if(this.Procedural) {
            this.Procedural.destroy()
        }
        if(this.HalfTone) {
            this.HalfTone.destroy()
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