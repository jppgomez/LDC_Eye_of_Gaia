import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
//Noise Usage from Guillaume Mourier (@ledoublegui) 
import * as TWEEN from '@tweenjs/tween.js';

let scene, camera, renderer, controls, ambientLight;
let camera_tween_f0t1, camera_tween_f1t0;
let noise, noise_set, eye_set;

let state = 0;

let part_geom, part_points, part_vert = [], theta = [], phi = [];

//FACE DETECTION
//Adapted from @bomanimc
//https://github.com/ml5js/ml5-library/blob/main/examples/javascript/FaceApi/FaceApi_Video_Landmarks/sketch.js
let faceapi, video;
let canvas, context, cam_width = 426, cam_height = 240;
let faceX, faceY, faceSize;

let eyelid_posZ, eyelidTop, eyelidBottom, eyelid_material, eyelidT_mesh, eyelidB_mesh;

//onload create detection + video
document.addEventListener('DOMContentLoaded', () => {
    createDetection();
});

//responsiveness
window.addEventListener('resize', function () {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});


//create and trigger detection
async function createDetection() {
    //ml5 detection options
    const detectionOptions = {
        withLandmarks: true,
        withDescriptors: false,
        //minConfidence: 0.5,
    };
    //get video
    video = await getVideo();
    //create canvas for presenting detection
    canvas = document.createElement("canvas");
    canvas.width = cam_width;
    canvas.height = cam_height;
    canvas.id = 'camera_canvas';
    canvas.setAttribute('style', 'position:absolute; top: 0; left:0;');
    document.body.appendChild(canvas);
    context = canvas.getContext('2d', { willReadFrequently: true });
    //startup detection
    faceapi = ml5.faceApi(video, detectionOptions, faceDetectReady);
}

//start detection when loaded + start three.js sketch
function faceDetectReady() {
    console.log('ready :)');
    init();
    animate();
    faceapi.detect(getResults);
}

//get, present and handle results
function getResults(err, result) {
    //handle error
    if (err) {
        console.log(err);
        return;
    }
    //handle results - draw canvas with camera
    context.fillStyle = "#000000";
    context.fillRect(0, 0, cam_width, cam_height);
    context.drawImage(video, 0, 0, cam_width, cam_height);

    if (result) {
        if (result.length > 0) {
            //draw box around face detected
            faceBox(result);
            //get normalized values for center of box
            faceX = ((result[0].alignedRect._box._x + (result[0].alignedRect._box._width / 2)) * window.innerWidth) / cam_width;
            faceY = ((result[0].alignedRect._box._y + (result[0].alignedRect._box._height / 2)) * window.innerHeight) / cam_height;
            faceSize = ((result[0].alignedRect._box._height * window.innerWidth) / cam_width) * ((result[0].alignedRect._box._height * window.innerHeight) / cam_height);
            //console.log(faceX, faceY);

        }
    }
    else {
        faceX = undefined;
        faceY = undefined;
        faceSize = undefined;
    }
    faceapi.detect(getResults);
}

//box around faces
function faceBox(result) {
    const alignedRect = result[0].alignedRect;
    const x = alignedRect._box._x;
    const y = alignedRect._box._y;
    const boxWidth = alignedRect._box._width;
    const boxHeight = alignedRect._box._height;

    context.beginPath();
    context.rect(x, y, boxWidth, boxHeight);
    context.strokeStyle = "#FF0000";
    context.stroke();
    context.closePath();
}

//get camera video
async function getVideo() {
    //get camera video on a html video element
    const video = document.createElement("video");
    video.setAttribute('style', 'display:none;');
    video.width = cam_width;
    video.height = cam_height;
    document.body.appendChild(video);
    //setup camera as video source
    const camera = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = camera;
    video.play();

    return video;
}

//intialize three.js sketch
function init() {
    eye_set = {
        eye_radius: 100,
        particle_number: 50000,
        particle_color: 0xffffff,
        particle_size: 0.4,
        tunnel_radius: 100,
        tunnel_radius_multipliter: 4,
        theta_min: 0.25,
        theta_max: 2 * Math.PI / 3,
        phi_min: 0,
        phi_max: 2 * Math.PI,
        rotation_max: Math.PI,
        frst_distance: 70,
        scnd_distance: 220,
    }

    const line_colors = new Float32Array([
        1.0, 1.0, 1.0,
        0.0, 0.0, 0.0
    ]);

    //Scene + Camera + Render
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.005);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); //FOV, Aspect_Ratio, Near, Far
    camera.position.set(0, 0, eye_set.frst_distance);
    camera.lookAt(0, 0, 0);

    camera_tween_f0t1 = new TWEEN.Tween(camera.position.z).to({z: eye_set.scnd_distance}, 5000).onUpdate(() => {
        camera.position.set(0, 0, eye_set.scnd_distance);
    }).start();
    camera_tween_f1t0 = new TWEEN.Tween(camera.position.z).to({ z: eye_set.frst_distance }, 3000).onUpdate(() => {
        camera.position.set(0, 0, eye_set.frst_distance);

    }).start();
    
    camera_tween_f0t1.easing(TWEEN.Easing.Back.In);
    camera_tween_f1t0.easing(TWEEN.Easing.Back.In);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight); //canvas size

    document.body.appendChild(renderer.domElement); //add canvas to DOM
    controls = new OrbitControls(camera, renderer.domElement); //orbit controls

    //Lights
    ambientLight = new THREE.AmbientLight(0xffbf00);
    scene.add(ambientLight);

    //AXIS
    let axis = true;
    if (axis) {
        const xblue = new THREE.LineBasicMaterial({ color: 0x0000ff });
        const ygreen = new THREE.LineBasicMaterial({ color: 0x008000 });
        const zred = new THREE.LineBasicMaterial({ color: 0xFF0000 });
        const xpoints = [];
        xpoints.push(new THREE.Vector3(50, 0, 0));
        xpoints.push(new THREE.Vector3(0, 0, 0));
        const ypoints = [];
        ypoints.push(new THREE.Vector3(0, 50, 0));
        ypoints.push(new THREE.Vector3(0, 0, 0));
        const zpoints = [];
        zpoints.push(new THREE.Vector3(0, 0, 50));
        zpoints.push(new THREE.Vector3(0, 0, 0));

        const xgeometry = new THREE.BufferGeometry().setFromPoints(xpoints);
        const xline = new THREE.Line(xgeometry, xblue);
        scene.add(xline);
        const ygeometry = new THREE.BufferGeometry().setFromPoints(ypoints);
        const yline = new THREE.Line(ygeometry, ygreen);
        scene.add(yline);
        const zgeometry = new THREE.BufferGeometry().setFromPoints(zpoints);
        const zline = new THREE.Line(zgeometry, zred);
        scene.add(zline);
    }

    noise = new SimplexNoise();
    noise_set = {
        scale_0: 0.1,
        x_scale_0: 0.03,
        y_scale_0: 0.03,
        z_scale_0: 0.15,
        scale_1: 0.01,
        x_scale_1: 0.25,
        y_scale_1: 0.25,
        z_scale_1: 0.75,

    }
    //PARTICLES
    part_geom = new THREE.BufferGeometry();
    for (let p = 0; p < eye_set.particle_number; p++) {
        theta[p] = THREE.MathUtils.randFloat(eye_set.theta_min, eye_set.theta_max); //0.3-2.5
        phi[p] = THREE.MathUtils.randFloatSpread(eye_set.phi_max);

        const x = (eye_set.tunnel_radius + THREE.MathUtils.randFloatSpread(eye_set.tunnel_radius)) * Math.cos(p * ((2 * Math.PI) / (eye_set.particle_number)));
        const y = (eye_set.tunnel_radius + THREE.MathUtils.randFloatSpread(eye_set.tunnel_radius)) * Math.sin(p * ((2 * Math.PI) / (eye_set.particle_number)));
        const z = THREE.MathUtils.randFloatSpread(eye_set.tunnel_radius_multipliter * eye_set.tunnel_radius);

        part_vert.push(x, y, z);
    }
    part_geom.setAttribute('position', new THREE.Float32BufferAttribute(part_vert, 3));
    part_geom.setAttribute('color', new THREE.BufferAttribute(line_colors, 3));
    let part_mat = new THREE.PointsMaterial({
        color: eye_set.particle_color,
        size: eye_set.particle_size
    });
    part_points = new THREE.Points(part_geom, part_mat);
    scene.add(part_points);

    //mask 2 cubes opposite to blink
    eyelid_posZ = -6*eye_set.eye_radius;
    eyelidTop = new THREE.BoxGeometry(2.5*eye_set.eye_radius, 2.5*eye_set.eye_radius, 2.5*eye_set.eye_radius);
    eyelidBottom = new THREE.BoxGeometry(2.5*eye_set.eye_radius, 2.5*eye_set.eye_radius, 2.5*eye_set.eye_radius);
    eyelid_material = new THREE.MeshBasicMaterial( { color: 0x000000 , size: THREE.DoubleSide} ); 
    eyelidT_mesh = new THREE.Mesh( eyelidTop, eyelid_material );
    eyelidB_mesh = new THREE.Mesh(eyelidBottom, eyelid_material); 
    eyelidT_mesh.position.set(0, eyelid_posZ, 0);
    eyelidB_mesh.position.set(0, -eyelid_posZ, 0);
    eyelidT_mesh.rotation.x = Math.PI/2;
    eyelidB_mesh.rotation.x = Math.PI/2;
    scene.add( eyelidT_mesh );
    scene.add(eyelidB_mesh);
}

//Loop Function - Draw Scene Every Time Screen is Refreshed -> Only when user is in page
function animate() {
    requestAnimationFrame(animate);

    if (state == 0) { //particle field
        let n0;
        for (let p = 0; p < part_points.geometry.getAttribute('position').count; p++) {
            n0 = noise.noise3d(part_points.geometry.getAttribute('position').getX(p) * noise_set.scale_0, part_points.geometry.getAttribute('position').getY(p) * noise_set.scale_0, part_points.geometry.getAttribute('position').getZ(p) * noise_set.scale_0)
            let a0 = (Math.PI * 2) * n0 + (renderer.info.render.frame / 30);

            const newX = part_points.geometry.getAttribute('position').getX(p) + Math.cos(a0) * noise_set.x_scale_0;
            const newY = part_points.geometry.getAttribute('position').getY(p) + Math.sin(a0) * noise_set.y_scale_0;
            const newZ = part_points.geometry.getAttribute('position').getZ(p) + Math.cos(a0) * Math.sin(a0) * noise_set.z_scale_0;

            part_points.geometry.getAttribute('position').setXYZ(p, newX, newY, newZ);

        }
        part_points.geometry.getAttribute('position').needsUpdate = true;

    }
    else if (state == 1) { //eye build
        let n1;
        for (let p = 0; p < part_points.geometry.getAttribute('position').count; p++) {
            n1 = noise.noise3d(part_points.geometry.getAttribute('position').getX(p) * noise_set.scale_1, part_points.geometry.getAttribute('position').getY(p) * noise_set.scale_1, part_points.geometry.getAttribute('position').getZ(p) * noise_set.scale_1)
            let a1 = (Math.PI * 2) * n1 + (renderer.info.render.frame / 30);
            const newX = eye_set.eye_radius * Math.sin(theta[p]) * Math.cos(phi[p]) + Math.cos(a1) * noise_set.x_scale_1;
            const newY = eye_set.eye_radius * Math.sin(theta[p]) * Math.sin(phi[p]) + Math.sin(a1) * noise_set.y_scale_1;
            const newZ = eye_set.eye_radius * Math.cos(theta[p]) + Math.cos(a1) * Math.sin(a1) * noise_set.z_scale_1;
            part_points.geometry.getAttribute('position').setXYZ(p, newX, newY, newZ);
        }
        part_points.geometry.getAttribute('position').needsUpdate = true;

        state = 2;
    }
    else if (state == 2) { //eye follow
        blink();
        let moveX = mapValue(faceX, 0, window.innerWidth, -100, 100);
        let moveY = mapValue(faceY, 0, window.innerHeight, -50, 50);
        let moveZ = eye_set.scnd_distance + mapValue(faceSize, 0, window.innerWidth*window.innerHeight, 30, -30);
        camera.position.set(moveX, moveY, moveZ);
        camera.lookAt(0,0,eye_set.eye_radius/2);
    }
    else if (state == 3) { //eye mirror

    }

    renderer.render(scene, camera);
    console.log(state);
}

//keyPressing for changing states - for testing purposes only
window.addEventListener("keypress", (e) => {
    if (e.key == "q") {
        camera_tween_f1t0.update();
        state = 0;
    }
    else if (e.key == "w") {
        camera_tween_f0t1.update();
        state = 1;
    }
    else if (e.key == "e") state = 2;
    else if (e.key == "r") state = 3;
});

//MAP FUNCTION
    function mapValue(value, minI, maxI, minF, maxF) {
        value = (value - minI) / (maxI - minI);
        return minF + value * (maxF - minF);
    }

    function blink(){
        if(eyelid_posZ < eye_set.eye_radius){
            eyelid_posZ += 5;  
        }
        else if(eyelid_posZ < 2.2*eye_set.eye_radius){
            eyelid_posZ += 10;
        }
        else {
            eyelid_posZ = -20*eye_set.eye_radius;
        }
        eyelidT_mesh.position.set(0, eyelid_posZ, 0);
        eyelidB_mesh.position.set(0, -eyelid_posZ, 0);
    }