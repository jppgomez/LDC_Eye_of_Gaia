import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

//import {GUI} from 'dat.gui';
//const gui = new GUI();

//Scene + Camera + Render
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.005);
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 ); //FOV, Aspect_Ratio, Near, Far
camera.position.set( 50, 50, 100);
camera.lookAt( 0, 0, 0 );
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight ); //canvas size

document.body.appendChild( renderer.domElement ); //add canvas to DOM
const controls = new OrbitControls(camera, renderer.domElement); //orbit controls
//Lights
const ambientLight = new THREE.AmbientLight(0xffbf00);
scene.add(ambientLight);
/* const directionalLight = new THREE.DirectionalLight(0xffbf00, 1);
directionalLight.position.set(0.5,1,0.5);
scene.add(directionalLight); */

//AXIS
    const xblue = new THREE.LineBasicMaterial( { color: 0x0000ff } );
    const ygreen = new THREE.LineBasicMaterial( { color: 0x008000 } );
    const zred = new THREE.LineBasicMaterial( { color: 0xFF0000 } );
    const xpoints = [];
    xpoints.push( new THREE.Vector3(50 , 0, 0 ) );
    xpoints.push( new THREE.Vector3( 0, 0, 0 ) );
    const ypoints = [];
    ypoints.push( new THREE.Vector3(0, 50, 0 ) );
    ypoints.push( new THREE.Vector3( 0, 0, 0 ) );
    const zpoints = [];
    zpoints.push( new THREE.Vector3(0, 0, 50 ) );
    zpoints.push( new THREE.Vector3( 0, 0, 0 ) );

    const xgeometry = new THREE.BufferGeometry().setFromPoints( xpoints );
    const xline = new THREE.Line( xgeometry, xblue );
    scene.add( xline );
    const ygeometry = new THREE.BufferGeometry().setFromPoints( ypoints );
    const yline = new THREE.Line( ygeometry, ygreen );
    scene.add( yline );
    const zgeometry = new THREE.BufferGeometry().setFromPoints( zpoints );
    const zline = new THREE.Line( zgeometry, zred );
    scene.add( zline );

//Add Shere
/*const geometry = new THREE.SphereGeometry( 1, 32, 16 ); 
const material = new THREE.MeshPhongMaterial( { color: 0xffffff } ); 
const sphereMesh = new THREE.Mesh( geometry, material );
scene.add( sphereMesh );
gui.add(sphereMesh.scale, 'x',  0, 2).name('Sphere Radius');*/

let eye_set = {
    eye_radius : 50,
    particle_number : 200,
    particle_color : 0xffffff,
    particle_size : 0.5
}

let line_set = {
    n_vertex: 100,
    color: 0xffffff,
    width: 5,
}

const line_colors = new Float32Array([
    1.0, 1.0, 1.0,
    0.0, 0.0, 0.0
]);
/* const eye_vert = [];
const eye_theta = [];
const eye_phi = []; */

const eye_lines = [];

for (let i = 0; i < eye_set.particle_number; i++) {
    let eye_geom = new THREE.BufferGeometry();
    const line_vert = [];
    let theta = THREE.MathUtils.randFloat(0.25, 0.4); //0.3-2.5
    let phi = THREE.MathUtils.randFloatSpread(2*Math.PI);
    for(let j = 0; j < line_set.n_vertex; j++){
        let new_theta = theta + THREE.MathUtils.randFloat(-1,2);
        let new_phi = phi + THREE.MathUtils.randFloatSpread(0.25);

        if(new_theta >= 0.25 && new_theta <= 0.6*Math.PI){
          const x = eye_set.eye_radius * Math.sin(new_theta) * Math.cos(new_phi);
          const y = eye_set.eye_radius * Math.sin(new_theta) * Math.sin(new_phi);
          const z = eye_set.eye_radius * Math.cos(new_theta);  
          
          line_vert.push(x,y,z); 
        }              
    }

    eye_geom.setAttribute('color',  new THREE.BufferAttribute(line_colors,3));
    let eye_mat = new THREE.LineBasicMaterial({
        //vertexColors: true,
        linewidth: line_set.width,
    });
    eye_geom.setAttribute('position', new THREE.Float32BufferAttribute(line_vert, 3));
    eye_lines[i] = new THREE.LineSegments(eye_geom, eye_mat);
    scene.add(eye_lines[i]);
}



//Loop Function - Draw Scene Every Time Screen is Refreshed -> Only when user is in page
function animate() {
	requestAnimationFrame( animate );

    //Animation
    for(let i=0; i < line_set.n_vertex; i++){
        if(renderer.info.render.frame % 4 == 0)
        eye_lines[i].geometry.setDrawRange(0, renderer.info.render.frame);
    }

    controls.update();
    renderer.render(scene, camera);
}
animate();