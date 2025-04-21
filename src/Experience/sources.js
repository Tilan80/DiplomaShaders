export default [
    {
    name: 'environmentMapTexture',
    type: 'cubeTexture',
    path:
        [
            'textures/environmentMap/px.jpg',
            'textures/environmentMap/nx.jpg',
            'textures/environmentMap/py.jpg',
            'textures/environmentMap/ny.jpg',
            'textures/environmentMap/pz.jpg',
            'textures/environmentMap/nz.jpg'
        ]
    },
    {
        name: 'noiseTexture',
        type: 'texture',
        path: 'Noise/Perlin5.png'
    },
    {
        name: 'morphingModels',
        type: 'gltfModel',
        path: 'models/morphingModels.glb'
    },
    {
        name: 'sunriseEnv',
        type: 'rgbe',
        path: 'textures/sunrise/sunrise.hdr'
    },
]