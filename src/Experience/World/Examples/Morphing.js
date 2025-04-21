
import * as THREE from 'three'
import Experience from '../../Experience.js'

import gsap from 'gsap'

import morphVertexShader from './Shaders/Morphing/vertex.glsl'
import morphFragmentShader from './Shaders/Morphing/fragment.glsl'

export default class Morphing {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.debug = this.experience.debug

        this.width = this.experience.sizes.width
        this.height = this.experience.sizes.height
        this.pixelRatio = this.experience.sizes.pixelRatio

        this.camera = this.experience.camera

        this.morphModels = this.resources.items.morphingModels

        this.particles = {}
        this.particles.index = 0

        // Positions
        this.positions = this.morphModels.scene.children.map(child => child.geometry.attributes.position)
        this.particles.maxCount = 0
        for (const position of this.positions) {
            if (position.count > this.particles.maxCount) {
                this.particles.maxCount = position.count
            }
        }

        this.particles.positions = []
        for (const position of this.positions) {
            const originalArray = position.array
            const newArray = new Float32Array(this.particles.maxCount * 3)

            for (let i = 0; i < this.particles.maxCount; i++) {
                const i3 = i * 3

                if (i3 < originalArray.length) {
                    newArray[i3    ] = originalArray[i3    ]
                    newArray[i3 + 1] = originalArray[i3 + 1]
                    newArray[i3 + 2] = originalArray[i3 + 2]
                } else {
                    const randomIndex = Math.floor(position.count * Math.random()) * 3
                    newArray[i3    ] = originalArray[randomIndex + 0]
                    newArray[i3 + 1] = originalArray[randomIndex + 1]
                    newArray[i3 + 2] = originalArray[randomIndex + 2]
                }
            }
            this.particles.positions.push(new THREE.BufferAttribute(newArray, 3))
        }

        // Geometry
        this.sizesArray = new Float32Array(this.particles.maxCount)

        for (let i = 0; i < this.particles.maxCount; i++) {
            this.sizesArray[i] = 0.1 + Math.random() * 0.9
        }

        this.particles.geometry = new THREE.BufferGeometry()
        this.particles.geometry.setAttribute('position', this.particles.positions[this.particles.index])
        this.particles.geometry.setAttribute('aPositionTarget', this.particles.positions[3])
        this.particles.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizesArray, 1))

        // Material
        this.particles.color1 = '#00ffff'
        this.particles.color2 = '#ff00ff'
        this.particles.material = new THREE.ShaderMaterial({
            vertexShader: morphVertexShader,
            fragmentShader: morphFragmentShader,
            uniforms:
            {
                uSize: new THREE.Uniform(0.4),
                uResolution: new THREE.Uniform(new THREE.Vector2
                            (this.width * this.pixelRatio, this.height * this.pixelRatio)),
                uProgress: new THREE.Uniform(0),
                uColor1: new THREE.Uniform(new THREE.Color(this.particles.color1)),
                uColor2: new THREE.Uniform(new THREE.Color(this.particles.color2)),
            },
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        })

        // Points
        this.particles.points = new THREE.Points(this.particles.geometry, this.particles.material)
        this.particles.points.frustumCulled = false
        this.scene.add(this.particles.points)

        // Displacement
        this.displacementArray = new Float32Array(this.particles.maxCount * 3);
        this.particles.geometry.setAttribute('aDisplacement', new THREE.BufferAttribute(this.displacementArray, 3));
        

        /**
         * Morphing
         */
        this.particles.morph = (index) => {
            // Update attributes
            this.particles.geometry.attributes.position = this.particles.positions[this.particles.index];
            this.particles.geometry.attributes.aPositionTarget = this.particles.positions[index];
            
            // Reset displacement
            const displacementAttribute = this.particles.geometry.attributes.aDisplacement;
            for (let i = 0; i < displacementAttribute.array.length; i++) {
                displacementAttribute.array[i] = 0;
            }
            displacementAttribute.needsUpdate = true;
            
            // Animate progress
            gsap.fromTo(
                this.particles.material.uniforms.uProgress,
                { value: 0 },
                { 
                    value: 1, 
                    duration: 2, 
                    ease: 'linear',
                }
            );
            
            // Save Index
            this.particles.index = index;
        }

        this.particles.morph0 = () => { this.particles.morph(0) }
        this.particles.morph1 = () => { this.particles.morph(1) }
        this.particles.morph2 = () => { this.particles.morph(2) }
        this.particles.morph3 = () => { this.particles.morph(3) }


        /**
         * Debug tweaks
         */
        this.debugFolder = this.debug.ui.addFolder('Morphing')
        this.debugFolder.addColor(this.particles, 'color1')
            .onChange(() => { 
                this.particles.material.uniforms.uColor1.value.set(this.particles.color1) 
            })
        this.debugFolder.addColor(this.particles, 'color2')
            .onChange(() => { 
                this.particles.material.uniforms.uColor2.value.set(this.particles.color2) 
            })


        this.debugFolder.add(this.particles.material.uniforms.uProgress, 'value')
                                                    .min(0)
                                                    .max(1)
                                                    .step(0.001)
                                                    .name('uProgress')
                                                    .listen()
        this.debugFolder.add(this.particles, 'morph0')
        this.debugFolder.add(this.particles, 'morph1')
        this.debugFolder.add(this.particles, 'morph2')
        this.debugFolder.add(this.particles, 'morph3')


        /**
         * Hover displacement
         */
        this.raycaster = new THREE.Raycaster();
        
        // Add mouse tracking variables
        this.mouse = new THREE.Vector2(999, 999);
        this.previousMouse = new THREE.Vector2(999, 999);
        this.mouseVelocity = new THREE.Vector2(0, 0);
        
        // Mouse move handler
        this.onPointerMove = (event) => {
            // Store previous position
            this.previousMouse.copy(this.mouse);
            
            // Update current position
            this.mouse.x = (event.clientX / this.width) * 2 - 1;
            this.mouse.y = -(event.clientY / this.height) * 2 + 1;
            
            // Calculate velocity (movement direction and speed)
            this.mouseVelocity.subVectors(this.mouse, this.previousMouse);
            
            // Call animatePoints
            this.animatePoints();
        }
        
        window.addEventListener('pointermove', this.onPointerMove);
    }
        

    animatePoints() {
        let points = this.particles.points;
        
        // Cast ray from mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera.instance);
        
        // Calculate ray direction and origin for manual distance calculations
        const rayOrigin = new THREE.Vector3().copy(this.raycaster.ray.origin);
        const rayDirection = new THREE.Vector3().copy(this.raycaster.ray.direction);
        
        // Get intersections
        let intersects = this.raycaster.intersectObjects([points]);
        
        // Only proceed if we have at least one intersection
        if (intersects.length > 0) {
            const displacementAttribute = points.geometry.attributes.aDisplacement;
            
            // Get the first intersection point as reference
            const intersectionPoint = intersects[0].point;
            
            // Define the radius of influence
            const radius = 1.0;
            
            // Get the current progress value
            const progress = this.particles.material.uniforms.uProgress.value;
            
            // Loop through all points
            for (let i = 0; i < points.geometry.attributes.position.count; i++) {
                const i3 = i * 3;
                
                // Get the current interpolated position based on morph progress
                const positionAttribute = points.geometry.attributes.position;
                const targetAttribute = points.geometry.attributes.aPositionTarget;
                
                // Calculate the current interpolated position
                const currentX = positionAttribute.array[i3] * (1 - progress) + targetAttribute.array[i3] * progress;
                const currentY = positionAttribute.array[i3 + 1] * (1 - progress) + targetAttribute.array[i3 + 1] * progress;
                const currentZ = positionAttribute.array[i3 + 2] * (1 - progress) + targetAttribute.array[i3 + 2] * progress;
                
                const pointPosition = new THREE.Vector3(currentX, currentY, currentZ);
                
                // Calculate distance from intersection point to current point
                const distanceToIntersection = pointPosition.distanceTo(intersectionPoint);
                
                // Calculate distance from ray to point (to affect points at the back too)
                // This gives us the closest distance from the ray to the point
                const rayToPointVector = new THREE.Vector3();
                const closestPointOnRay = new THREE.Vector3();
                
                // Calculate vector from ray origin to point
                rayToPointVector.subVectors(pointPosition, rayOrigin);
                
                // Project this vector onto ray direction to find closest point on ray
                const projectionLength = rayToPointVector.dot(rayDirection);
                closestPointOnRay.copy(rayOrigin).addScaledVector(rayDirection, projectionLength);
                
                // Calculate distance from point to closest point on ray
                const distanceToRay = pointPosition.distanceTo(closestPointOnRay);
                
                // Combined influence: points close to either the intersection or the ray
                const combinedInfluence = Math.min(
                    distanceToIntersection / radius,  // Influence from intersection point
                    distanceToRay / (radius * 0.3)    // Influence from ray (tighter radius)
                );
                
                // If point is within influence range
                if (combinedInfluence < 1.0) {
                    // Calculate strength (stronger when closer)
                    const strength = 1.0 - combinedInfluence;
                    
                    // Direction for displacement
                    let direction = new THREE.Vector3();
                    
                    // Get mouse movement direction in world space
                    const mouseDirection = new THREE.Vector3(
                        this.mouseVelocity.x, 
                        this.mouseVelocity.y, 
                        0
                    ).normalize();
                    
                    // Transform to world space
                    const worldMouseDirection = mouseDirection.clone()
                        .applyQuaternion(this.camera.instance.quaternion);
                    
                    // Use mouse direction for displacement
                    direction.copy(worldMouseDirection);
                    
                    // Apply displacement with appropriate strength
                    const displacement = 0.5 * strength * strength; // Quadratic falloff for smoother effect
                    const velocityFactor = Math.min(10, this.mouseVelocity.length() * 30); // Scale based on mouse speed
                    
                    displacementAttribute.array[i3    ] = direction.x * displacement * velocityFactor;
                    displacementAttribute.array[i3 + 1] = direction.y * displacement * velocityFactor;
                    displacementAttribute.array[i3 + 2] = direction.z * displacement * velocityFactor;
                }
            }
            
            displacementAttribute.needsUpdate = true;
        }
    }
    

    update() {
        // Gradually reduce displacement over time
        const displacementAttribute = this.particles.geometry.attributes.aDisplacement;
        for (let i = 0; i < displacementAttribute.array.length; i++) {
            displacementAttribute.array[i] *= 0.99; // Decay factor
        }
        displacementAttribute.needsUpdate = true;
    }

    destroy() {
        // Cleanup
        this.particles.geometry.dispose();
        this.particles.material.dispose();
        this.particles.points.geometry.dispose();
        this.particles.points.material.dispose();
        // this.particles.points.removeFromParent();
        this.scene.remove(this.particles.points);

        // Clean up morph models
        // if(this.morphModels) {
        //     this.morphModels.scene.traverse((child) => {
        //         if(child.geometry) child.geometry.dispose();
        //         if(child.material) {
        //             if(Array.isArray(child.material)) {
        //                 child.material.forEach(material => material.dispose());
        //             } else {
        //                 child.material.dispose();
        //             }
        //         }
        //     });
        // }

        // Clear evenet
        window.removeEventListener('pointermove', this.onPointerMove);

        // Clear references
        this.particles = null
        this.positions = null
        this.sizesArray = null
        this.colorsArray = null
        this.displacementArray = null
        this.displacementAttribute = null
        // this.mouse = null

        // Remove debug
        this.debugFolder.destroy();
    }
    
}