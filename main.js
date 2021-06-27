import * as THREE from './vendor/three.module.js'
import { OrbitControls } from './vendor/OrbitControls.js'
import Stats from './vendor/stats.module.js';
let sound, camera, renderer, canvas, freqs, hiBall, rings, vizGroup, floaterRed, scene, analyser, floaterBlue;
let controls, floaterGreen, stats;
let objects;

init();
requestAnimationFrame(render);

function init() {

    canvas = document.getElementById('c');
    renderer = new THREE.WebGLRenderer({ canvas });

    objects = {
        floaters: [],
        speaker: {
            rings: [],
            group: undefined
        },
        scene: undefined
    };
    const config = {
        cam: {

            fov: 75,
            aspect: 2,
            near: 0.1,
            far: 60,
            zPos: 25,
        },
        scene: {
            color: 0x000000
        }
    };

    stats = new Stats();
    stats.showPanel(1);
    document.body.appendChild(stats.dom);
    stats.dom.style.left = 'unset';
    stats.dom.style.right = '0%';

    // cam setup
    camera = new THREE.PerspectiveCamera(
        config.cam.fov, config.cam.aspect, config.cam.near, config.cam.far
    );
    camera.position.z = config.cam.zPos;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(config.scene.color);
    objects.scene = scene;

    const boxMaterial = new THREE.MeshPhongMaterial({ color: 0xa8a8a8 });
    boxMaterial.flatShading = true;

    // make speaker
    // create 15 rings, concentric, from outside in
    vizGroup = new THREE.Group();
    rings = [];
    for (let i = 0; i < 15; i++) {
        var ring = new THREE.Mesh(
            new THREE.TorusGeometry(1 - (i / 15) + .5 * i, .2, 16, 16),
            boxMaterial
        );
        vizGroup.add(ring);
        rings.push(ring);
    }
    rings.reverse();


    hiBall = new THREE.Mesh(
        new THREE.SphereGeometry(.5),
        boxMaterial
    );
    vizGroup.add(hiBall);
    scene.add(vizGroup)


    floaterRed = new THREE.PointLight(0xff0000, 1.5, 20);
    floaterRed.add(new THREE.Mesh(new THREE.SphereGeometry(.25), new THREE.MeshBasicMaterial({ color: 0xff0000 })));
    scene.add(floaterRed);
    floaterBlue = new THREE.PointLight(0x0000ff, 1.5, 20);
    floaterBlue.add(new THREE.Mesh(new THREE.SphereGeometry(.25), new THREE.MeshBasicMaterial({ color: 0x0000ff })));
    scene.add(floaterBlue);
    floaterGreen = new THREE.PointLight(0x00ff00, 1.5, 20);
    floaterGreen.add(new THREE.Mesh(new THREE.SphereGeometry(.25), new THREE.MeshBasicMaterial({ color: 0x00ff00 })));
    scene.add(floaterGreen);
    objects.floaters = [floaterRed, floaterBlue, floaterGreen];

    vizGroup.rotation.x = -Math.PI * .35;
    vizGroup.rotation.y = Math.PI * .75;
    vizGroup.position.z = -2
    vizGroup.position.x = 3
    vizGroup.position.y = -4

    // let there be light
    const light = new THREE.DirectionalLight(
        0xFFFFFF, 1
    );
    light.position.set(-1, 2, 4);
    scene.add(light);

    const room = new THREE.Mesh(
        new THREE.BoxGeometry(30, 30, 50),
        new THREE.MeshPhongMaterial({
            color: 0xa0adaf,
            side: THREE.BackSide
        })
    );
    room.receiveShadow = true;
    scene.add(room);




    renderer.render(scene, camera);
    /** https://threejs.org/docs/index.html?q=audio#api/en/audio/AudioAnalyser */
    const listener = new THREE.AudioListener();
    camera.add(listener);
    sound = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('./voxel_revolution.mp3',
        buffer => {
            sound.setBuffer(buffer);
            sound.setLoop(true);
            sound.setVolume(0.5);
        });
    document.getElementById('play').addEventListener('click', () => sound.play());

    analyser = new THREE.AudioAnalyser(sound, 32);
    freqs = [];
    for (let i = 0; i < 16; i++) {
        freqs.push(0);
    }

    controls = new OrbitControls(camera, renderer.domElement);
    controls.update();
}

/** HELPERS */

function resizeRendererToDisplaySize(renderer) {
    /** https://threejsfundamentals.org/threejs/lessons/threejs-responsive.html */
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.heigth !== height;

    if (needResize) {
        renderer.setSize(width, height, false);
    }

    return needResize;
}
function norm(val, min, max) {  // normalize to f0-f1
    /** https://gist.github.com/Anthodpnt/aafeb0dc669fb9137dd0550b6f5d8630 */
    return (val - min) / (max - min)
}

/** MAKE IT MOVE */

function render(time) {
    stats.begin();
    if (sound.isPlaying) {

        freqs = analyser.getFrequencyData();
    }

    time *= 0.001;

    // make canvas according to viewport
    // might affect performance??? find out
    if (resizeRendererToDisplaySize(renderer)) {

        canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }


    const normBall = norm(freqs[freqs.length - 1], 0, 254);
    hiBall.position.z = normBall <= 0.2 ? -norm(freqs[freqs.length - 2], 0, 254) * 6 : -normBall * 6;
    for (let i = 0; i < rings.length; i++) {
        const ring = rings[i];
        const normed = norm(freqs[i], 0, 254);
        ring.position.z = normed * (i + 5);
        ring.rotation.z = time * (i) * .125;
    }
    hiBall.rotation.x = time;
    hiBall.rotation.y = time;

    floaterBlue.position.x = Math.cos(time) * 8;
    floaterBlue.position.y = Math.sin(time) * 8;
    floaterBlue.position.z = Math.cos(time) * 8;

    floaterRed.position.x = Math.cos(time) * 8;
    floaterRed.position.y = Math.cos(time) * 8;
    floaterRed.position.z = Math.sin(time) * 8;

    floaterGreen.position.x = Math.sin(time) * 8;
    floaterGreen.position.y = Math.cos(time) * 8;
    floaterGreen.position.z = Math.cos(time) * 8;

    controls.update();
    renderer.render(scene, camera);
    stats.end();

    // and do it again!
    requestAnimationFrame(render);
}