const video = document.getElementById("video");
const result = document.getElementById("result");

// START CAMERA FIRST
navigator.mediaDevices.getUserMedia({ video: true })
.then(stream => {
    video.srcObject = stream;
})
.catch(() => {
    result.innerText = "Camera permission denied";
});

// LOAD FACE API MODELS
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('Models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('Models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('Models')
]).then(startRecognition);

async function startRecognition(){

const labels = ['yash','nikhil','charan'];

const labeledDescriptors = await Promise.all(
labels.map(async label => {

    const img = await faceapi.fetchImage(`students/${label}.jpg`);

    const detections = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();

    return new faceapi.LabeledFaceDescriptors(label,[detections.descriptor]);

})
);

const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors,0.6);

video.addEventListener("play", () => {

setInterval(async () => {

const detections = await faceapi
.detectAllFaces(video,new faceapi.TinyFaceDetectorOptions())
.withFaceLandmarks()
.withFaceDescriptors();

if(detections.length > 0){

const match = faceMatcher.findBestMatch(detections[0].descriptor);

if(match.label !== "unknown"){
result.innerText = match.label + " belongs to DCME-B";
}else{
result.innerText = "Face not recognised";
}

}

},1000);

});

}
