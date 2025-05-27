varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewDirection;

void main() {
    // Position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;

    // Model normal
    vec3 modelNormal = (modelMatrix * vec4(normal, 0.0)).xyz;

    // Varyings
    vNormal = modelNormal;
    vPosition = modelPosition.xyz;
    vViewDirection = normalize(modelPosition.xyz - cameraPosition);
}