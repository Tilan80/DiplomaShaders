import EventEmitter from "./EventEmitter";
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

export default class Resources extends EventEmitter {
    constructor(sources) {
        super()

        // Options
        this.sources = sources

        // Setup
        this.items = {}
        this.toLoad = this.sources.length
        this.loaded = 0

        this.setLoaders()
        this.startLoading()
    }

    setLoaders() {
        this.loaders = {}
        this.loaders.gltfLoader = new GLTFLoader()
        this.loaders.textureLoader = new THREE.TextureLoader()
        this.loaders.cubeTextureLoader = new THREE.CubeTextureLoader()
        this.loaders.dracoLoader = new DRACOLoader()
        this.loaders.dracoLoader.setDecoderPath('/draco/')
        this.loaders.gltfLoader.setDRACOLoader(this.loaders.dracoLoader)
        this.loaders.rgbeLoader = new RGBELoader()
                
    }

    startLoading() {
        for (const source of this.sources) {
            if (source.type === 'gltfModel') {
                this.loaders.gltfLoader.load(
                    source.path,
                    (file) => {
                        this.sourceLoaded(source, file)
                    }
                )
            } else if (source.type === 'texture') {
                this.loaders.textureLoader.load(
                    source.path,
                    (file) => {
                        this.sourceLoaded(source, file)
                    }
                )
            } else if (source.type === 'cubeTexture') {
                this.loaders.cubeTextureLoader.load(
                    source.path,
                    (file) => {
                        this.sourceLoaded(source, file)
                    }
                )
            } else if (source.type === 'rgbe') {
                this.loaders.rgbeLoader.load(
                    source.path,
                    (file) => {
                        this.sourceLoaded(source, file)
                    }
                )
            }
        }
    }

    sourceLoaded(source, file) {
        this.items[source.name] = file

        this.loaded++

        if (this.loaded === this.toLoad) {
            this.trigger('ready')
        }
    }

    // loadMorphingModels() {
    //     console.log('object');
    //     this.source = this.sources.find(source => source.name === 'morphingModels')
    //     this.loaders.gltfLoader.load(
    //         this.source.path,
    //         (file) => {
    //             console.log(file);
    //             this.items[this.source.name] = file
    //         }
    //     )
    // }
}