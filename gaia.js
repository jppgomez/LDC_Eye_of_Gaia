import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
//Noise Usage from Guillaume Mourier (@ledoublegui)

let reduceFactor = 100;
let numberSpecies = parseInt(2153294 / reduceFactor); //2 153 294 / 100
//Data - Vertebrates
let colorVert = [
    {red:56/255, green: 132/255, blue: 255/255},    
    {red:56/255, green: 195/255, blue: 255/255},
    {red:107/255, green: 56/255, blue: 255/255},
    {red:56/255, green: 70/255, blue: 255/255},
    {red:56/255, green: 255/255, blue: 252/255},
];
let nMammals = parseInt(6631 / reduceFactor);
let nBirds = parseInt(11197 / reduceFactor);
let nReptiles = parseInt(12060 / reduceFactor);
let nAmphibians = parseInt(8707 / reduceFactor);
let nFishes = parseInt(36367 / reduceFactor);

let nVert = nMammals + nBirds + nReptiles + nAmphibians + nFishes;
//Data - Invertebrates
let colorInvert = [
    {red:255/255, green: 219/255, blue: 179/255},    
    {red:255/255, green: 239/255, blue: 179/255},
    {red:255/255, green: 206/255, blue: 179/255},
    {red:255/255, green: 230/255, blue: 179/255},
    {red:255/255, green: 248/255, blue: 179/255},
    {red:245/255, green: 255/255, blue: 179/255},
    {red:213/255, green: 255/255, blue: 179/255},
    {red:179/255, green: 255/255, blue: 203/255},
];
let nInsects = parseInt(1053578 / reduceFactor);
let nMolluscs = parseInt(86254 / reduceFactor);
let nCrustaceans = parseInt(84382 / reduceFactor);
let nCorals = parseInt(5614 / reduceFactor);
let nArachnids = parseInt(92766 / reduceFactor);
let nVelvetWorms = parseInt(210 / reduceFactor);
let nHorseshoeCrabs = parseInt(4 / reduceFactor);
let nOtherInv = parseInt(157543 / reduceFactor);

let nInvert = nInsects + nMolluscs + nCrustaceans + nCorals + nArachnids + nVelvetWorms + nHorseshoeCrabs + nOtherInv;
//Data - Plants
let colorPlants = [
    {red:62/255, green: 255/255, blue: 48/255},    
    {red:149/255, green: 255/255, blue: 48/255},
    {red:48/255, green: 255/255, blue: 178/255},
    {red:48/255, green: 255/255, blue: 107/255},
    {red:235/255, green: 255/255, blue: 107/255},
    {red:48/255, green: 255/255, blue: 249/255},
];
let nMosses = parseInt(21925 / reduceFactor);
let nFernsAllies = parseInt(11800 / reduceFactor);
let nGymnosperms = parseInt(1113 / reduceFactor);
let nFloweringPlants = parseInt(369000 / reduceFactor);
let nGreenAlgae = parseInt(13644 / reduceFactor);
let nRedAlgae = parseInt(7553 / reduceFactor);

let nPlants = nMosses + nFernsAllies + nGymnosperms + nFloweringPlants + nGreenAlgae + nRedAlgae;
//Data - FungiProtists
let colorFungiProtists = [
    {red:255/255, green: 56/255, blue: 169/255},    
    {red:237/255, green: 56/255, blue: 255/255},
    {red:255/255, green: 58/255, blue: 56/255},
];
let nLichens = parseInt(17000 / reduceFactor);
let nMushrooms = parseInt(151316 / reduceFactor);
let nBrownAlgae = parseInt(4630 / reduceFactor);

let nFungiProtists = nLichens + nMushrooms + nBrownAlgae;

let extinctionRate = 170; //170 extinctions per day (2 point per second)
let interactionTimer = 0;
let extinctCounter = 0;

let scene, camera, renderer, controls, ambientLight;
let cam_coords, cam_theta, cam_phi;
let noise, noise_set, eye_set;

let state = 0;

let part_geom, part_points, part_vert = [], part_col = [], theta = [], phi = [], init_x = [], init_y = [], init_z = [];

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

//loading
THREE.DefaultLoadingManager.onStart = function(url, itemsLoaded, itemsTotal){
    document.querySelector("body").style.visibility = "hidden";
    document.querySelector("#loader").style.visibility = "visible";
    document.querySelector("body").style.overflowY = "hidden";  
}
THREE.DefaultLoadingManager.onLoad = function(){
   document.querySelector("#loader").style.display = "none";
   document.querySelector("body").style.visibility = "visible";
   document.querySelector("body").style.overflowY = "initial"; 
   document.getElementById("caption").style.display = "flex";
}

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
        particle_size: 1.35,
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
    let axis = false;
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
    for (let p = 0; p < eye_set.particle_number; p++) {
        theta[p] = THREE.MathUtils.randFloat(eye_set.theta_min, eye_set.theta_max); //0.3-2.5
        phi[p] = THREE.MathUtils.randFloatSpread(eye_set.phi_max);

        init_x[p] = (eye_set.tunnel_radius + THREE.MathUtils.randFloatSpread(eye_set.tunnel_radius)) * Math.cos(p * ((2 * Math.PI) / (eye_set.particle_number)));
        init_y[p] = (eye_set.tunnel_radius + THREE.MathUtils.randFloatSpread(eye_set.tunnel_radius)) * Math.sin(p * ((2 * Math.PI) / (eye_set.particle_number)));
        init_z[p] = THREE.MathUtils.randFloatSpread(eye_set.tunnel_radius_multipliter * eye_set.tunnel_radius);

        part_vert.push(init_x[p], init_y[p], init_z[p]);
        
        //VERTEBRATES
        if(p > 0 && p < nMammals) part_col.push(colorVert[0].red, colorVert[0].green, colorVert[0].blue);
        else if(p > nMammals && p < nMammals + nBirds) part_col.push(colorVert[1].red, colorVert[1].green, colorVert[1].blue);
        else if(p > nMammals + nBirds && p < nMammals+ nBirds + nReptiles) part_col.push(colorVert[2].red, colorVert[2].green, colorVert[2].blue);
        else if(p > nMammals+ nBirds + nReptiles && p < nMammals + nBirds + nReptiles + nAmphibians) part_col.push(colorVert[3].red, colorVert[3].green, colorVert[3].blue);
        else if(p > nMammals + nBirds + nReptiles + nAmphibians && p < nVert) part_col.push(colorVert[4].red, colorVert[4].green, colorVert[4].blue);
        //INVERTEBRATES
        if(p > nVert && p < nVert + nInsects) part_col.push(colorInvert[0].red, colorInvert[0].green, colorInvert[0].blue);
        else if(p > nVert + nInsects && p < nVert + nInsects + nMolluscs) part_col.push(colorInvert[1].red, colorInvert[1].green, colorInvert[1].blue);
        else if(p > nVert + nInsects + nMolluscs && p < nVert + nInsects + nMolluscs + nCrustaceans) part_col.push(colorInvert[2].red, colorInvert[2].green, colorInvert[2].blue);
        else if(p > nVert + nInsects + nMolluscs + nCrustaceans && p < nVert + nInsects + nMolluscs + nCrustaceans + nCorals) part_col.push(colorInvert[3].red, colorInvert[3].green, colorInvert[3].blue);
        else if(p > nVert + nInsects + nMolluscs + nCrustaceans + nCorals && p < nVert + nInsects + nMolluscs + nCrustaceans + nCorals + nArachnids) part_col.push(colorInvert[4].red, colorInvert[4].green, colorInvert[4].blue);
        else if(p > nVert + nInsects + nMolluscs + nCrustaceans + nCorals + nArachnids && p < nVert + nInsects + nMolluscs + nCrustaceans + nCorals + nArachnids + nVelvetWorms) part_col.push(colorInvert[5].red, colorInvert[5].green, colorInvert[5].blue);
        else if(p > nVert + nInsects + nMolluscs + nCrustaceans + nCorals + nArachnids + nVelvetWorms && p < nVert + nInsects + nMolluscs + nCrustaceans + nCorals + nArachnids + nVelvetWorms + nHorseshoeCrabs) part_col.push(colorInvert[6].red, colorInvert[6].green, colorInvert[6].blue);
        else if(p > nVert + nInvert - nOtherInv && p < nVert + nInvert) part_col.push(colorInvert[7].red, colorInvert[7].green, colorInvert[7].blue);
        //PLANTS
        if(p > nVert + nInvert && p < nVert + nInvert + nMosses) part_col.push(colorPlants[0].red, colorPlants[0].green, colorPlants[0].blue);
        else if(p > nVert + nInvert + nMosses && p < nVert + nInvert + nMosses + nFernsAllies) part_col.push(colorPlants[1].red, colorPlants[1].green, colorPlants[1].blue);
        else if(p > nVert + nInvert + nMosses + nFernsAllies && p < nVert + nInvert + nMosses + nFernsAllies + nGymnosperms) part_col.push(colorPlants[2].red, colorPlants[2].green, colorPlants[2].blue);
        else if(p > nVert + nInvert + nMosses + nFernsAllies + nGymnosperms && p < nVert + nInvert + nMosses + nFernsAllies + nGymnosperms + nFloweringPlants) part_col.push(colorPlants[3].red, colorPlants[3].green, colorPlants[3].blue);
        else if(p > nVert + nInvert + nMosses + nFernsAllies + nGymnosperms + nFloweringPlants && p < nVert + nInvert + nMosses + nFernsAllies + nGymnosperms + nFloweringPlants + nGreenAlgae) part_col.push(colorPlants[4].red, colorPlants[4].green, colorPlants[4].blue);
        else if(p > nVert + nInvert + nPlants - nRedAlgae && p < nVert + nInvert + nPlants) part_col.push(colorPlants[5].red, colorPlants[5].green, colorPlants[5].blue);
        //FUNGI & PROTISTS
        if(p > nVert + nInvert + nPlants && p < nVert + nInvert + nPlants + nLichens) part_col.push(colorFungiProtists[0].red, colorFungiProtists[0].green, colorFungiProtists[0].blue);
        else if(p > nVert + nInvert + nPlants + nLichens && p < nVert + nInvert + nPlants + nLichens + nMushrooms) part_col.push(colorFungiProtists[1].red, colorFungiProtists[1].green, colorFungiProtists[1].blue);
        else if(p > nVert + nInvert + nPlants + nFungiProtists - nBrownAlgae && p < nVert + nInvert + nPlants + nFungiProtists) part_col.push(colorFungiProtists[2].red, colorFungiProtists[2].green, colorFungiProtists[2].blue);
        //OTHER - CATCH ERRORS
        if(p >= nVert + nInvert + nPlants + nFungiProtists) part_col.push(1,1,1);
    }
    const part_txt = new THREE.TextureLoader().load("./static/shape.png");
    part_geom.setAttribute('color', new THREE.Float32BufferAttribute(part_col, 3));
    let part_mat = new THREE.PointsMaterial({
        map: part_txt,
        vertexColors: true,
        size: eye_set.particle_size
    });
    part_geom.setAttribute('position', new THREE.Float32BufferAttribute(part_vert, 3));
    part_points = new THREE.Points(part_geom, part_mat);
    scene.add(part_points);

    //mask 2 cubes opposite to blink
    eyelid_posZ = -3 * eye_set.eye_radius;
    eyelidTop = new THREE.BoxGeometry(2.5 * eye_set.eye_radius, 2.5 * eye_set.eye_radius, 2.5 * eye_set.eye_radius);
    eyelidBottom = new THREE.BoxGeometry(2.5 * eye_set.eye_radius, 2.5 * eye_set.eye_radius, 2.5 * eye_set.eye_radius);
    eyelid_material = new THREE.MeshBasicMaterial({ color: 0x000000});
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

    //console.log(part_geom);

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
        part_points.geometry.setDrawRange(0, eye_set.particle_number - parseInt(extinctCounter/reduceFactor));
    }
    else if (state == 1) { //eye build + say hello
        document.getElementById("extinct_today").style.display = "block";
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
        if(interactionTimer % 30 == 0){
            goExtinct();  
        } 
        //console.log(interactionTimer);
        part_points.geometry.setDrawRange(0, eye_set.particle_number - parseInt(extinctCounter/reduceFactor));
        //console.log(eye_set.particle_number - extinctCounter);
    }
    else if (state == 3) { //eye mirror
        //follow();
        particleDeform();

        pupil_mesh.material = cameraMat;
        cameraText.needsUpdate = true;
        pupil_mesh.material.needsUpdate = true;
        pupilDeform();

        document.getElementById('responsability').style.display = 'block';
        interactionTimer++;
        if(interactionTimer % 30 == 0){
            goExtinct();  
        } 

        part_points.geometry.setDrawRange(0, eye_set.particle_number - parseInt(extinctCounter/reduceFactor));
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
    interactionTimer = 0;

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

    document.getElementById('extinct_today').style.display = 'none';
    document.getElementById('responsability').style.display = 'none';
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

function goExtinct(){
    if(extinctCounter < (numberSpecies*reduceFactor)){
           for(let e = 0; e < parseInt(extinctionRate/reduceFactor); e++){
            extinctCounter+=170;
            document.getElementById('extinct_today').innerHTML = '<b>' + extinctCounter + '</b> species became extinct </br> while someone was looking.';
            document.getElementById('responsability').innerHTML = 'You were responsible for <b>' + (parseInt(interactionTimer/30)*extinctionRate) + '</b>.';
        }
    }
    else window.location.reload();
         
    }

    //visual fixes - text position (bottom) + particles