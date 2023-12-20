import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
//Noise Usage from Guillaume Mourier (@ledoublegui)

let numberSpecies = 200000;
let extinctionRate = 10000;
let interactionTimer = 0;
let extinctCounter = 0;

let scene, camera, renderer, controls, ambientLight;
let cam_coords, cam_theta, cam_phi;
let noise, noise_set, eye_set;

let state = 0;

let part_geom, part_points, part_vert = [], theta = [], phi = [], init_x = [], init_y = [], init_z = [];

//FACE DETECTION
//Adapted from @bomanimc
//https://github.com/ml5js/ml5-library/blob/main/examples/javascript/FaceApi/FaceApi_Video_Landmarks/sketch.js
let faceapi, video;
let canvas, context, cam_width = 426, cam_height = 240;
let faceX, faceY, faceSize;

let filterThreshold = 70; //adjust according to lighting conditions - possible time map for daylight

let eyelid_posZ, eyelidTop, eyelidBottom, eyelid_material, eyelidT_mesh, eyelidB_mesh, blinking = false;

let pupil_geom, pupil_mat, pupil_mesh, pupil_initX = [], pupil_initY = [];
let cameraText, cameraMat;

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
    context.filter = 'blur(1.75px)';
    let imageData = context.getImageData(0, 0, cam_width, cam_height);
    let filteredImageData = thresholdFilter(imageData, filterThreshold);
    context.putImageData(filteredImageData, 0, 0);

    canvas.style.display = 'none';

    if (result) {
        if (result.length > 0) {
            let faceBoxX, faceBoxY, faceBoxW = 0, faceBoxH = 0;
            for (let r = 0; r < result.length; r++) {
                if (result[r].alignedRect._box._width > faceBoxW && result[r].alignedRect._box._height > faceBoxH) {
                    faceBoxX = result[r].alignedRect._box._x;
                    faceBoxY = result[r].alignedRect._box._y;
                    faceBoxW = result[r].alignedRect._box._width;
                    faceBoxH = result[r].alignedRect._box._height;
                }
            }

            if (faceBoxX && faceBoxY) {
                //draw box around face detected
                //faceBox(result);
                //get normalized values for center of box
                faceX = ((faceBoxX + (faceBoxW / 2)) * window.innerWidth) / cam_width;
                faceY = ((faceBoxY + (faceBoxH / 2)) * window.innerHeight) / cam_height;
                //faceSize = ((faceBoxW * window.innerWidth) / cam_width) * ((faceBoxH * window.innerHeight) / cam_height);
                //console.log(faceX, faceY);
            }
        }
    }
    else {
        faceX = undefined;
        faceY = undefined;
        //faceSize = undefined;
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
        particle_number: numberSpecies,
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
        scnd_distance: 250,
        hello_counter: 0,
    }

    //Scene + Camera + Render
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.005);

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000); //FOV, Aspect_Ratio, Near, Far
    cam_coords = {
        x: 0,
        y: 0,
        z: eye_set.frst_distance
    };
    cam_theta = 0;
    cam_phi = 0;
    camera.position.set(cam_coords.x, cam_coords.y, cam_coords.z);
    camera.lookAt(0, 0, 0);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight); //canvas size

    document.body.appendChild(renderer.domElement); //add canvas to DOM
    controls = new OrbitControls(camera, renderer.domElement); //orbit controls

    //Lights
    ambientLight = new THREE.AmbientLight(0xffffff);
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
        x_scale_0: 1.1,
        y_scale_0: 1.1,
        z_scale_0: 1.4,
        scale_1: 0.05,
        x_scale_1: 0.01,
        y_scale_1: 0.01,
        z_scale_1: 0.02,

    }
    //PARTICLES
    part_geom = new THREE.BufferGeometry();
    const part_colors = new Float32Array(3*eye_set.particle_number);
    for (let p = 0; p < eye_set.particle_number; p++) {
        theta[p] = THREE.MathUtils.randFloat(eye_set.theta_min, eye_set.theta_max); //0.3-2.5
        phi[p] = THREE.MathUtils.randFloatSpread(eye_set.phi_max);

        init_x[p] = (eye_set.tunnel_radius + THREE.MathUtils.randFloatSpread(eye_set.tunnel_radius)) * Math.cos(p * ((2 * Math.PI) / (eye_set.particle_number)));
        init_y[p] = (eye_set.tunnel_radius + THREE.MathUtils.randFloatSpread(eye_set.tunnel_radius)) * Math.sin(p * ((2 * Math.PI) / (eye_set.particle_number)));
        init_z[p] = THREE.MathUtils.randFloatSpread(eye_set.tunnel_radius_multipliter * eye_set.tunnel_radius);

        part_vert.push(init_x[p], init_y[p], init_z[p]);

        for(let col = 0; col < 3; col++) part_colors[col*p] = 1.0;
    }
    let part_mat = new THREE.PointsMaterial({
        vertexColors: true,
        size: eye_set.particle_size
    });
    part_geom.setAttribute('position', new THREE.Float32BufferAttribute(part_vert, 3));
    part_geom.setAttribute('color', new THREE.Float32BufferAttribute(part_colors, 3));
    part_points = new THREE.Points(part_geom, part_mat);
    scene.add(part_points);

    //mask 2 cubes opposite to blink
    eyelid_posZ = -3 * eye_set.eye_radius;
    eyelidTop = new THREE.BoxGeometry(2.5 * eye_set.eye_radius, 2.5 * eye_set.eye_radius, 2.5 * eye_set.eye_radius);
    eyelidBottom = new THREE.BoxGeometry(2.5 * eye_set.eye_radius, 2.5 * eye_set.eye_radius, 2.5 * eye_set.eye_radius);
    eyelid_material = new THREE.MeshBasicMaterial({ color: 0x000000, size: THREE.DoubleSide });
    eyelidT_mesh = new THREE.Mesh(eyelidTop, eyelid_material);
    eyelidB_mesh = new THREE.Mesh(eyelidBottom, eyelid_material);
    eyelidT_mesh.position.set(0, eyelid_posZ, 0);
    eyelidB_mesh.position.set(0, -eyelid_posZ, 0);
    eyelidT_mesh.rotation.x = Math.PI / 2;
    eyelidB_mesh.rotation.x = Math.PI / 2;
    scene.add(eyelidT_mesh);
    scene.add(eyelidB_mesh);

    pupil_geom = new THREE.CircleGeometry(1.1*(eye_set.eye_radius / 4), 16);
    pupil_mat = new THREE.MeshBasicMaterial({
        color: 0x000000
    });
    pupil_mesh = new THREE.Mesh(pupil_geom, pupil_mat);
    pupil_mesh.position.set(0, 0, eye_set.eye_radius-5);
    for (let m = 0; m < pupil_mesh.geometry.getAttribute('position').count; m++) {
        pupil_initX[m] = pupil_mesh.geometry.getAttribute('position').getX(m);
        pupil_initY[m] = pupil_mesh.geometry.getAttribute('position').getY(m);
    }

    cameraText = new THREE.CanvasTexture(canvas);
    cameraMat = new THREE.MeshPhongMaterial();
    cameraMat.map = cameraText;

    console.log(part_geom);

}

//Loop Function - Draw Scene Every Time Screen is Refreshed -> Only when user is in page
const animate = (t) => {
    requestAnimationFrame(animate);

    if (state == 0) { //particle field
        transition_2_0();

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
    else if (state == 1) { //eye build + say hello
        transition_0_1();
    }
    else if (state == 2) { //eye follow
        //blinking on a random timer
        if (blinking) blink();
        if (Math.trunc(t) % 400 == 0) blinking = true;
        //follow person
        follow();
        //particles 
        particleDeform();

        pupil_mesh.material = pupil_mat;
        pupil_mesh.material.needsUpdate = true;

        interactionTimer++;
        if(interactionTimer % 30 == 0) goExtinct();
        console.log(interactionTimer);
    }
    else if (state == 3) { //eye mirror
        //follow();
        particleDeform();

        pupil_mesh.material = cameraMat;
        cameraText.needsUpdate = true;
        pupil_mesh.material.needsUpdate = true;
        pupilDeform();

        interactionTimer+=(1/30);
    }
    renderer.render(scene, camera);
    console.log(state);
}

//keyPressing for changing states - for testing purposes only
window.addEventListener("keypress", (e) => {
    if (e.key == "q") state = 0;
    else if (e.key == "w") state = 1;
    else if (e.key == "e") state = 2;
    else if (e.key == "r") state = 3;
});

//TRANSITIONS
function transition_0_1() {
    if (cam_coords.z < eye_set.scnd_distance) {
        cam_coords.z += 10;
    }
    else {
        cam_coords.z = eye_set.scnd_distance;
        if (eye_set.hello_counter < 24) shake();
        else {
            eye_set.hello_counter = 0;
            scene.add(pupil_mesh);
            state = 2;
        }
    }

    for (let p = 0; p < part_points.geometry.getAttribute('position').count; p++) {
        part_points.geometry.getAttribute('position').setXYZ(p, (eye_set.eye_radius * Math.sin(theta[p]) * Math.cos(phi[p])), (eye_set.eye_radius * Math.sin(theta[p]) * Math.sin(phi[p])), (eye_set.eye_radius * Math.cos(theta[p])));

    }
    part_points.geometry.getAttribute('position').needsUpdate = true;
    camera.position.set(cam_coords.x, cam_coords.y, cam_coords.z);
}

function transition_2_0() {
    if (eye_set.hello_counter < 24 && eye_set.hello_counter != 0) shake();

    scene.remove(pupil_mesh);
    if (cam_coords.z > eye_set.frst_distance) {
        cam_coords.z -= 5;
        if (cam_coords.x > 0) cam_coords.x--;
        else if (cam_coords.x < 0) cam_coords.x++;

        if (cam_coords.y < 0) cam_coords.y++;
        else if (cam_coords.y > 0) cam_coords.y--;
    }
    else {
        cam_coords.x = 0;
        cam_coords.y = 0;
        cam_coords.z = eye_set.frst_distance;
        eye_set.hello_counter = 0;
    }
    for (let p = 0; p < part_points.geometry.getAttribute('position').count; p++) {
        part_points.geometry.getAttribute('position').setXYZ(p, init_x[p], init_y[p], init_z[p]);

    }
    part_points.geometry.getAttribute('position').needsUpdate = true;

    camera.position.set(cam_coords.x, cam_coords.y, cam_coords.z);
    camera.lookAt(0, 0, 0);
}


//MAP FUNCTION
function mapValue(value, minI, maxI, minF, maxF) {
    value = (value - minI) / (maxI - minI);
    return minF + value * (maxF - minF);
}


function particleDeform() {
    let n1;
    for (let p = 0; p < part_points.geometry.getAttribute('position').count; p++) {
        n1 = noise.noise3d(part_points.geometry.getAttribute('position').getX(p) * noise_set.scale_1, part_points.geometry.getAttribute('position').getY(p) * noise_set.scale_1, part_points.geometry.getAttribute('position').getZ(p) * noise_set.scale_1)
        let a1 = (Math.PI * 2) * n1 + (renderer.info.render.frame / 30);
        const newX = part_points.geometry.getAttribute('position').getX(p) + Math.cos(a1) * noise_set.x_scale_1;
        const newY = part_points.geometry.getAttribute('position').getY(p) + Math.sin(a1) * noise_set.y_scale_1;
        const newZ = part_points.geometry.getAttribute('position').getZ(p) + Math.cos(a1) * Math.sin(a1) * noise_set.z_scale_1;
        part_points.geometry.getAttribute('position').setXYZ(p, newX, newY, newZ);
    }
    part_points.geometry.getAttribute('position').needsUpdate = true;
}

function blink() {
    if (eyelid_posZ < (-3) * eye_set.eye_radius) {
        eyelid_posZ += 15;
    }
    else if (eyelid_posZ < (-0.5) * eye_set.eye_radius) {
        eyelid_posZ += 10;
    }
    else if (eyelid_posZ < 0.5 * eye_set.eye_radius) {
        if (eyelid_posZ > (-4) * eye_set.eye_radius) eyelid_posZ -= 250;
        blinking = false;
    }
    eyelidT_mesh.position.set(0, eyelid_posZ, 0);
    eyelidB_mesh.position.set(0, -eyelid_posZ, 0);
}

function shake() {
    if (eye_set.hello_counter < 6) {
        part_points.rotateY(Math.PI / 40);
        part_points.rotateZ(THREE.MathUtils.randFloatSpread(Math.PI / 40));
        eye_set.hello_counter += 1.75;
    }
    else if (eye_set.hello_counter < 18) {
        part_points.rotateY(-1 * Math.PI / 40);
        part_points.rotateZ(THREE.MathUtils.randFloatSpread(Math.PI / 40));
        eye_set.hello_counter += 1.75;
    }
    else if (eye_set.hello_counter < 24) {
        part_points.rotateY(Math.PI / 40);
        part_points.rotateZ(THREE.MathUtils.randFloatSpread(Math.PI / 40));
        eye_set.hello_counter += 1.75;
    }
}

function follow() {
    //face tracking
    let faceHoriz = mapValue(faceX, 0, window.innerWidth, -1 * (Math.PI / 8), Math.PI / 8);
    let faceVert = mapValue(faceY, 0, window.innerHeight, -1 * (Math.PI / 15), Math.PI / 15)
    //delay
    cam_theta = 0.83 * cam_theta + 0.17 * faceHoriz;
    cam_phi = 0.83 * cam_phi + 0.17 * faceVert;
    //sphere track
    let moveX = eye_set.scnd_distance * Math.cos(cam_phi) * Math.sin(cam_theta);
    let moveY = eye_set.scnd_distance * Math.sin(cam_phi);
    let moveZ = eye_set.scnd_distance * Math.cos(cam_theta) * Math.cos(cam_phi);
    //set position
    camera.position.set(moveX, moveY, moveZ);
    camera.lookAt(0, 0, 0);

}

//from Antonello Zanini (https://img.ly/blog/how-to-apply-filters-in-javascript/)
function thresholdFilter(
    imgData,
    threshold
) {
    const src = imgData.data;

    for (let i = 0; i < src.length; i += 4) {
        const r = src[i];
        const g = src[i + 1];
        const b = src[i + 2];

        let v;
        if (0.2126 * r + 0.7152 * g + 0.0722 * b >= threshold) v = 0;
        else v = 9;

        src[i] = src[i + 1] = src[i + 2] = v
    }
    return imgData;
};


function pupilDeform() {
    let n1;
    for (let p = 0; p < pupil_mesh.geometry.getAttribute('position').count; p++) {
        n1 = noise.noise3d(pupil_initX[p], pupil_initY[p], 0);
        let a1 = (Math.PI * 2) * n1 + (renderer.info.render.frame / 30);

        let newX = pupil_initX[p] + 0.7*Math.cos(a1);
        let newY = pupil_initY[p] + 0.7*Math.sin(a1);

        pupil_mesh.geometry.getAttribute('position').setXY(p, newX, newY);
    }
    pupil_mesh.geometry.getAttribute('position').needsUpdate = true;
}

//let extinctionTimer = 0;
//let particleExtinctSize = [];
//for(let e = 0; e < extinctionRate; e++) particleExtinctSize[e] = 0;

let extinct_today = document.getElementById('extinct_today');

function goExtinct(){
        for(let e = 0; e < extinctionRate; e++){
            let randPart = THREE.MathUtils.randFloat(0, part_points.geometry.attributes.size.array.length);
            /*if(extinctionTimer < 60){
                particleExtinctSize[e]++;
                part_points.geometry.setAttribute('size', particleExtinctSize[e]);
            }*/
            part_points.geometry.attributes.size.array[randPart] = 0;
            extinctCounter++;
            extinct_today.innerHTML = '<b>' + extinctCounter + '</b> species became extinct today.';
        }
        part_points.geometry.attributes.size.needsUpdate = true;
}


// text info
// fix reflexo