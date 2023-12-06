//Adapted from @bomanimc
//https://github.com/ml5js/ml5-library/blob/main/examples/javascript/FaceApi/FaceApi_Video_Landmarks/sketch.js

let faceapi, video;
let canvas, context;
const width = 426, height = 240;
let faceX, faceY;

//onload create detection + video
document.addEventListener('DOMContentLoaded', () => {
    createDetection();
});

//ml5 detection options
const detectionOptions = {
    withLandmarks: true,
    withDescriptors: false,
    minConfidence: 0.5,
}; 

//create and trigger detection
async function createDetection(){
    //get video
    video = await getVideo();
    //create canvas for presenting detection
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.id = 'camera_canvas';
    canvas.setAttribute('style', 'position:absolute; top: 0; left:0;');
    document.body.appendChild(canvas);
    context = canvas.getContext('2d', {willReadFrequently: true});
    //startup detection
    faceapi = ml5.faceApi(video, detectionOptions, faceDetectReady);
}

//start detection when loaded
function faceDetectReady(){
    console.log('ready :)');
    faceapi.detect(getResults);
}

//get, present and handle results
function getResults(err, result){
    //handle error
    if(err){
        console.log(err);
        return;
    }
    //handle results - draw canvas with camera
    context.fillStyle = "#000000";
    context.fillRect(0,0, width, height);
    context.drawImage(video, 0, 0, width, height);

    if(result){
        if(result.length > 0){
            //draw box around face detected
            faceBox(result);
            //get normalized values for center of box
            faceX = ((result[0].alignedRect._box._x + (result[0].alignedRect._box._width / 2)) * window.innerWidth) / width;
            faceY = ((result[0].alignedRect._box._y + (result[0].alignedRect._box._height / 2)) * window.innerHeight) / height;
            //console.log(faceX, faceY);
        }
    }
    faceapi.detect(getResults);
}

function faceBox(result){
    const alignedRect = result[0].alignedRect;
    const x = alignedRect._box._x;
    const y = alignedRect._box._y;
    const boxWidth = alignedRect._box._width;
    const boxHeight = alignedRect._box._height;

    context.beginPath();
    context.rect(x,y,boxWidth, boxHeight);
    context.strokeStyle = "#FF0000";
    context.stroke();
    context.closePath();
}

async function getVideo(){
    //get camera video on a html video element
    const video = document.createElement("video");
    video.setAttribute('style', 'display:none;');
    video.width = width;
    video.height = height;
    document.body.appendChild(video);
    //setup camera as video source
    const camera = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
    video.srcObject = camera;
    video.play();

    return video;
}