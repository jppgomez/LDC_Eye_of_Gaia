import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
 
//Scene + Camera + Render
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.005);
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 ); //FOV, Aspect_Ratio, Near, Far
camera.position.set(0, 0, 100);
camera.lookAt( 0, 0, 0 );
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
    scale: 0.1,
    x_scale: 0.05,
    y_scale: 0.05,
    z_scale: 0.15,
}

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

let state = 0;

let eye_set = {
    eye_radius : 20,
    particle_number : 200,
    particle_color : 0xffffff,
    particle_size : 0.5,
    tunnel_radius: 100
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


let particle_geom = new THREE.BufferGeometry();
const part_vert = [];
let part_points = 0;
//PARTICLES
for (let p = 0; p < eye_set.particle_number*100; p++){

    const x = (eye_set.tunnel_radius + THREE.MathUtils.randFloatSpread(eye_set.tunnel_radius)) * Math.cos(p * ((2 * Math.PI)/ (eye_set.particle_number*100)));
    const y = (eye_set.tunnel_radius + THREE.MathUtils.randFloatSpread(eye_set.tunnel_radius)) * Math.sin(p * ((2 * Math.PI)/ (eye_set.particle_number*100)));
    
    const z = THREE.MathUtils.randFloatSpread(4*eye_set.tunnel_radius);

   part_vert.push(x,y,z);
}
    particle_geom.setAttribute('position', new THREE.Float32BufferAttribute(part_vert, 3));
    particle_geom.setAttribute('color',  new THREE.BufferAttribute(line_colors,3));
    let particle_mat = new THREE.PointsMaterial({
        color: eye_set.particle_color,
        size: eye_set.particle_size
    });
    part_points = new THREE.Points(particle_geom, particle_mat);
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
        let n;
        
        for(let p = 0; p < part_points.geometry.getAttribute('position').count; p++){
            n = noise.noise3d(part_points.geometry.getAttribute('position').getX(p) * noise_set.scale, part_points.geometry.getAttribute('position').getY(p) * noise_set.scale, part_points.geometry.getAttribute('position').getZ(p) * noise_set.scale)
            let a = (Math.PI * 2) * n + (renderer.info.render.frame/30);
            const newX = part_points.geometry.getAttribute('position').getX(p) + Math.cos(a) * noise_set.x_scale;
            const newY = part_points.geometry.getAttribute('position').getY(p) + Math.sin(a) * noise_set.y_scale;
            const newZ = part_points.geometry.getAttribute('position').getZ(p) + Math.cos(a) * Math.sin(a) * noise_set.z_scale;
            
            part_points.geometry.getAttribute('position').setXYZ(p, newX, newY, newZ);

        }
        part_points.geometry.getAttribute('position').needsUpdate = true;
        
    }
    else if(state == 1){ //eye stop
        for(let p = 0; p < part_points.geometry.getAttribute('position').count; p++){
            const theta = THREE.MathUtils.randFloat(0.25, 0.4); //0.3-2.5
            const phi = THREE.MathUtils.randFloatSpread(2*Math.PI);
            const newX = eye_set.eye_radius * Math.sin(theta) * Math.cos(phi);
            const newY = eye_set.eye_radius * Math.sin(theta) * Math.sin(phi);
            const newZ = eye_set.eye_radius * Math.cos(theta);

            const newVec3 = new THREE.Vector3(newX, newY, newZ);

            const oldVec3 = new THREE.Vector3().fromBufferAttribute(part_points.geometry.attributes.position, p);
            oldVec3.lerp(newVec3, 0.5);
            //console.log(newVec3);
        }
        part_points.geometry.getAttribute('position').needsUpdate = true;
    }
    else if(state == 2){ //eye follow

    }
    else if(state == 3){ //eye mirror
        
    }


    //Animation
    /*for(let i=0; i < line_set.n_vertex; i++){
        if(renderer.info.render.frame % 8 == 0)
        eye_lines[i].geometry.setDrawRange(0, renderer.info.render.frame);
    }
    */
    controls.update();
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