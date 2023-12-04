
//Camera stream code from @cory
//https://dirask.com/posts/JavaScript-play-web-camera-video-on-canvas-element-webcam-usage-example-1xJEWp

function playStream(canvas, stream) {
    var video = document.createElement('video');
    video.addEventListener('loadedmetadata', function() {
        const context = canvas.getContext('2d', {willReadFrequently: true});
        var drawFrame = function() {
            context.drawImage(video, 0, 0);
            window.requestAnimationFrame(drawFrame);
        };
        drawFrame();
    });
    video.autoplay = true;
    //video.muted = true;
    video.srcObject = stream;
}

function playCamera(canvas, preferedWidth, preferedHeight) {
    var devices = navigator.mediaDevices;
    if (devices && 'getUserMedia' in devices) {
        var constraints = {
            video: {
                width: preferedWidth,
                height: preferedHeight
            }
            // you can use microphone adding `audio: true` property here
        };
        var promise = devices.getUserMedia(constraints);
        promise
            .then(function(stream) {
                playStream(canvas, stream);
            })
            .catch(function(error) {
                console.error(error.name + ': ' + error.message);
            });
    } else {
        console.error('Camera API is not supported.');
    }
}


// Usage example:
/*
var canvas = document.querySelector('#my-canvas');

playCamera(canvas, canvas.width, canvas.height);

//CAMERA TRACKING
let person = new tracking.ObjectTracker(['face']);
let faceX, faceY;

person.on('track', function(event) {
    if (event.data.length === 0) {
      // No objects were detected in this frame.
      console.log('no objects detected');
    } else {
        console.log('found');
        faceX = (event.data[0].x * window.innerWidth) / 320;
        faceY = (event.data[0].y * window.innerHeight) / 240;
        //console.log(faceX, faceY);
    }
  });
tracking.track('#my-canvas', person, {camera: true});


const detection = await faceapi.detectSingleFace(canvas);
console.log(detection);*/