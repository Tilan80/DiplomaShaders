uniform vec3 uColorWaterDeep;
uniform vec3 uColorWaterSurface;
uniform vec3 uColorSand;
uniform vec3 uColorGrass;
uniform vec3 uColorSnow;
uniform vec3 uColorRock;
uniform vec2 uTerrainPosition;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
uniform float uFogDensity;

varying vec3 vPosition;
varying float vUpDot;

#include ../includes/simplexNoise2d.glsl

void main() {
    // Color
    vec3 color = vec3(1.0);

    // Water
    float surfaceWaterMix = smoothstep(-1.0, -0.1, vPosition.y);
    color = mix(uColorWaterDeep, uColorWaterSurface, surfaceWaterMix);

    // Sand
    float sandMix = step(-0.1, vPosition.y);
    color = mix(color, uColorSand, sandMix);

    // Grass
    float grassMix = step(-0.06, vPosition.y);
    color = mix(color, uColorGrass, grassMix);

    // rock
    float rockMix = vUpDot;
    rockMix = 1.0 - step(0.8, rockMix);
    rockMix *= step(-0.06, vPosition.y);
    color = mix(color, uColorRock, rockMix);

    // Snow
    float snowThreshold = 0.45;
    snowThreshold += simplexNoise2d(vPosition.xz * 15.0) * 0.1;
    float snowMix = step(snowThreshold, vPosition.y);
    color = mix(color, uColorSnow, snowMix);

    // Apply improved fog effect that moves with the terrain
    
    // Get the world position that's not affected by terrain movement
    // This is the position before we add the terrain offset in the vertex shader
    vec3 worldPos = vPosition;
    worldPos.xz -= uTerrainPosition; // Subtract the terrain offset
    
    float viewDistance = length(worldPos - cameraPosition);
    
    // No fog before near distance
    float fogFactor = 0.0;
    
    if(viewDistance > uFogNear) {
        // Normalized distance for fog calculation (0 at near, 1 at far)
        float normalizedDistance = (viewDistance - uFogNear) / (uFogFar - uFogNear);
        normalizedDistance = clamp(normalizedDistance, 0.0, 1.0);
        
        // Combine linear distance with exponential fog for a more natural look
        fogFactor = normalizedDistance * (1.0 - exp(-uFogDensity * viewDistance));
        
        // Make fog stronger in the air and weaker on the ground
        float heightFactor = smoothstep(-0.5, 2.0, worldPos.y);
        fogFactor *= mix(0.5, 1.0, heightFactor);
    }
    
    // Apply fog with a subtle blend
    color = mix(color, uFogColor, fogFactor);

    // Final color
    csm_DiffuseColor = vec4(color, 1.0);
}
