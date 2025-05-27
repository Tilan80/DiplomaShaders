uniform vec3 uColor;
uniform vec2 uResolution;
uniform float uShadowRepetitions;
uniform vec3 uShadowColor;
uniform float uLightRepetitions;
uniform vec3 uLightColor;
uniform float uRimStrength;
uniform vec3 uRimColor;
uniform float uSpecularPower;
uniform vec3 uSpecularColor;
uniform float uPatternType; // 0.0 = circles, 1.0 = diamonds, 2.0 = lines, 3.0 = flower, 4.0 = cross

uniform int uShadingMode;
uniform int uToonLevels;
uniform float uOutlineWidth;
uniform vec3 uOutlineColor;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewDirection;

#include ../includes/ambientLight.glsl
#include ../includes/directionalLight.glsl


// Cartoon shading function
vec3 cartoonShading(float NdotL, vec3 baseColor, vec3 shadowColor, vec3 lightColor) {
    float toonLevels = float(uToonLevels);
    
    // Quantize the lighting to discrete levels
    float toonFactor = floor(NdotL * toonLevels) / (toonLevels - 1.0);
    
    if (uToonLevels == 3) {
        if (toonFactor > 0.66) {
            return baseColor;
        } else if (toonFactor > 0.1) {
            return mix(baseColor, shadowColor, 0.5);
        } else {
            return shadowColor;
        }
    } else { // 5 tone
        if (toonFactor > 0.9) {
            return baseColor;
        } else if (toonFactor > 0.7) {
            return mix(shadowColor, baseColor, 0.8);
        } else if (toonFactor > 0.3) {
            return mix(shadowColor, baseColor, 0.5);
        } else if (toonFactor > 0.1) {
            return mix(shadowColor, baseColor, 0.2);
        } else {
            return shadowColor;
        }
    }
}

// Star/flower shape function
float flowerShape(vec2 uv, float petals, float intensity) {
    // Center UV coordinates
    vec2 center = uv - 0.5;
    
    // Convert to polar coordinates
    float radius = length(center);
    float angle = atan(center.y, center.x);
    
    // Create flower/star shape
    float flower = cos(angle * petals) * 0.5 + 0.5;
    flower = smoothstep(0.0, 1.0, flower) * 0.5;
    
    // Adjust size based on intensity
    return step(radius, (0.3 + flower) * intensity);
}

// Improved halftone function with selectable pattern
vec3 halftone(
    vec3 color,
    float repetitions,
    vec3 direction,
    float low,
    float high,
    vec3 pointColor,
    vec3 normal,
    float patternType
    ) {
        float intensity = dot(normal, direction);
        intensity = smoothstep(low, high, intensity);

        vec2 uv = gl_FragCoord.xy / uResolution.y;
        uv *= repetitions;
        uv = mod(uv, 1.0);
        
        // Different pattern types
        float pattern;
        if (patternType < 0.5) {
            // Circle pattern
            pattern = distance(uv, vec2(0.5));
            pattern = step(pattern, 0.5 * intensity);
        } 
        else if (patternType < 1.5) {
            // Diamond pattern
            pattern = abs(uv.x - 0.5) + abs(uv.y - 0.5);
            pattern = step(pattern, 0.5 * intensity);
        }
        else if (patternType < 2.5) {
            // Line pattern
            float line = mod(uv.x + uv.y, 1.0);
            pattern = step(line, intensity);
        }
        else if (patternType < 3.5) {
            // Flower/star pattern (replacing reverse circle)
            pattern = flowerShape(uv, 6.0, intensity);
        }
        else {
            // Cross pattern
            float horizontal = step(abs(uv.y - 0.5), 0.1 * intensity);
            float vertical = step(abs(uv.x - 0.5), 0.1 * intensity);
            pattern = max(horizontal, vertical);
        }

        return mix(color, pointColor, pattern);
}

// Rim lighting effect
vec3 applyRimLight(vec3 color, vec3 normal, vec3 viewDir, float strength, vec3 rimColor) {
    float rim = 1.0 - max(dot(viewDir, normal), 0.0);
    rim = smoothstep(0.5, 1.0, rim);
    rim *= strength;
    return mix(color, rimColor, rim);
}

// Specular highlight
vec3 applySpecular(vec3 color, vec3 normal, vec3 lightDir, vec3 viewDir, float power, vec3 specColor) {
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfwayDir), 0.0), power);
    return color + spec * specColor;
}

void main() {
    if (uShadingMode == 0) {
        vec3 viewDirection = normalize(vPosition - cameraPosition);
        vec3 normal = normalize(vNormal);
        vec3 color = uColor;

        // Light
        vec3 light = vec3(0.0);

        light += ambientLight(
            vec3(1.0),
            0.3 // Reduced ambient to make other effects more visible
        );

        // Main directional light
        vec3 mainLightDir = normalize(vec3(1.0, 1.0, 0.0));
        light += directionalLight(
            vec3(1.0),
            0.7,
            normal,
            mainLightDir,
            viewDirection,
            1.0
        );

        // Secondary fill light
        vec3 fillLightDir = normalize(vec3(-0.5, 0.2, 0.8));
        light += directionalLight(
            vec3(0.3, 0.4, 0.5), // Cooler color for fill light
            0.3,
            normal,
            fillLightDir,
            viewDirection,
            1.0
        );

        color *= light;
        
        // float facingRatio = dot(normal, -viewDirection);
        // facingRatio = smoothstep(-0.5, 0.5, facingRatio);
        // color *= facingRatio;

        // Apply single halftone pattern based on selected type
        color = halftone(
            color, 
            uShadowRepetitions, 
            vec3(0.0, -1.0, 0.0), 
            -0.8, 
            1.5, 
            uShadowColor, 
            normal,
            uPatternType
        );
        
        color = halftone(
            color, 
            uLightRepetitions, 
            mainLightDir, 
            0.5, 
            1.5, 
            uLightColor, 
            normal,
            uPatternType
        );
        
        // Apply rim lighting
        color = applyRimLight(color, normal, -viewDirection, uRimStrength, uRimColor);
        
        // Apply specular highlights
        color = applySpecular(color, normal, mainLightDir, -viewDirection, uSpecularPower, uSpecularColor);

        // Final color
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
    } else {
        // Cartoon shading mode
        vec3 normal = normalize(vNormal);
        vec3 lightDirection = normalize(vec3(1.0, 1.0, 0.5));
        float NdotL = max(0.0, dot(normal, lightDirection));
        
        // Get cartoon shaded color
        vec3 cartoonColor = cartoonShading(NdotL, uColor, uShadowColor, uLightColor);
        
        gl_FragColor = vec4(cartoonColor, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
    }
    
}
