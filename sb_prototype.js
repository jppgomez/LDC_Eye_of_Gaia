import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
//Noise Usage from Guillaume Mourier (@ledoublegui) 

import * as TWEEN from '@tweenjs/tween.js';
 
//Scene + Camera + Render
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.005);

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 ); //FOV, Aspect_Ratio, Near, Far
camera.position.set(0, 0, 70);
camera.lookAt( 0, 0, 0 );

const camera_z = {z: camera.position.z};
const camera_tween_f0_t1 = new TWEEN.Tween(camera_z).to({z: 220}, 1300).onUpdate(() => camera.position.set(0, 0, camera_z.z)).start();
const camera_tween_f1_t0 = new TWEEN.Tween(camera_z).to({z: 70}, 1300).onUpdate(() => camera.position.set(0, 0, camera_z.z)).start();
camera_tween_f0_t1.easing(TWEEN.Easing.Back.In);
camera_tween_f1_t0.easing(TWEEN.Easing.Back.In);


const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight ); //canvas size

document.body.appendChild( renderer.domElement ); //add canvas to DOM
const controls = new OrbitControls(camera, renderer.domElement); //orbit controls
//responsiveness
window.addEventListener('resize', function(){
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
//Lights
const ambientLight = new THREE.AmbientLight(0xffbf00);
scene.add(ambientLight);
/* const directionalLight = new THREE.DirectionalLight(0xffbf00, 1);
directionalLight.position.set(0.5,1,0.5);
scene.add(directionalLight); */

const noise = new SimplexNoise();
let noise_set = {
    scale_0: 0.1,
    x_scale_0: 0.03,
    y_scale_0: 0.03,
    z_scale_0: 0.15,
    scale_1: 0.01,
    x_scale_1: 0.25,
    y_scale_1: 0.25,
    z_scale_1: 0.75,
    
}

//AXIS
let axis = true;
if(axis){
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
}

let state = 0;

let eye_set = {
    eye_radius : 100,
    particle_number : 50000,
    particle_color : 0xffffff,
    particle_size : 0.4,
    tunnel_radius: 100,
    tunnel_radius_multipliter: 4,
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


let part_geom = new THREE.BufferGeometry();
const part_vert = [];
let part_points = 0;
let theta = [], phi = [];
//PARTICLES
for (let p = 0; p < eye_set.particle_number; p++){
    theta[p] = THREE.MathUtils.randFloat(0.25, 2*Math.PI/3); //0.3-2.5
    phi[p] = THREE.MathUtils.randFloatSpread(2*Math.PI);

  const x = (eye_set.tunnel_radius + THREE.MathUtils.randFloatSpread(eye_set.tunnel_radius)) * Math.cos(p * ((2 * Math.PI)/ (eye_set.particle_number)));
  const y = (eye_set.tunnel_radius + THREE.MathUtils.randFloatSpread(eye_set.tunnel_radius)) * Math.sin(p * ((2 * Math.PI)/ (eye_set.particle_number)));
  const z = THREE.MathUtils.randFloatSpread(eye_set.tunnel_radius_multipliter*eye_set.tunnel_radius);

      part_vert.push(x,y,z);
}
    part_geom.setAttribute('position', new THREE.Float32BufferAttribute(part_vert, 3));
    part_geom.setAttribute('color',  new THREE.BufferAttribute(line_colors,3));
    let part_mat = new THREE.PointsMaterial({
        color: eye_set.particle_color,
        size: eye_set.particle_size
    });
    part_points = new THREE.Points(part_geom, part_mat);
    scene.add(part_points); 


/*
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
}*/



//Loop Function - Draw Scene Every Time Screen is Refreshed -> Only when user is in page
function animate() {
	requestAnimationFrame( animate );

    if(state == 0){ //particle field

        camera_tween_f1_t0.update();

        let n0;
        
        for(let p = 0; p < part_points.geometry.getAttribute('position').count; p++){
            n0 = noise.noise3d(part_points.geometry.getAttribute('position').getX(p) * noise_set.scale_0, part_points.geometry.getAttribute('position').getY(p) * noise_set.scale_0, part_points.geometry.getAttribute('position').getZ(p) * noise_set.scale_0)
            let a0 = (Math.PI * 2) * n0 + (renderer.info.render.frame/30);

            const newX = part_points.geometry.getAttribute('position').getX(p) + Math.cos(a0) * noise_set.x_scale_0;
            const newY = part_points.geometry.getAttribute('position').getY(p) + Math.sin(a0) * noise_set.y_scale_0;
            const newZ = part_points.geometry.getAttribute('position').getZ(p) + Math.cos(a0) * Math.sin(a0) * noise_set.z_scale_0;
            
            part_points.geometry.getAttribute('position').setXYZ(p, newX, newY, newZ);

        }
        part_points.geometry.getAttribute('position').needsUpdate = true;
        
    }
    else if(state == 1){ //eye stop

        camera_tween_f0_t1.update();

        let n1;
        
        for(let p = 0; p < part_points.geometry.getAttribute('position').count; p++){
            n1 = noise.noise3d(part_points.geometry.getAttribute('position').getX(p) * noise_set.scale_1, part_points.geometry.getAttribute('position').getY(p) * noise_set.scale_1, part_points.geometry.getAttribute('position').getZ(p) * noise_set.scale_1)
            let a1 = (Math.PI * 2) * n1 + (renderer.info.render.frame/30);
           
            const newX = eye_set.eye_radius * Math.sin(theta[p]) * Math.cos(phi[p]) + Math.cos(a1) * noise_set.x_scale_1;
            const newY = eye_set.eye_radius * Math.sin(theta[p]) * Math.sin(phi[p]) + Math.sin(a1) * noise_set.y_scale_1;
            const newZ = eye_set.eye_radius * Math.cos(theta[p]) + Math.cos(a1) * Math.sin(a1) * noise_set.z_scale_1;

            //const newVec3 = new THREE.Vector3(newX, newY, newZ);

            //const oldVec3 = new THREE.Vector3().fromBufferAttribute(part_points.geometry.attributes.position, p);
            //oldVec3.lerp(newVec3, 0.5);
            
            part_points.geometry.getAttribute('position').setXYZ(p, newX, newY, newZ);
            //console.log(newVec3);
        }
        part_points.geometry.getAttribute('position').needsUpdate = true;
    }
    else if(state == 2){ //eye follow

    }
    else if(state == 3){ //eye mirror
        
    }

    //controls.update();
    renderer.render(scene, camera);

    console.log(state);
}

window.addEventListener("keypress", key);
function key(e){
    if(e.key == "q") state = 0;
    else if(e.key == "w") state = 1;
    else if(e.key == "e") state = 2;
    else if(e.key == "r") state = 3;
}

animate();