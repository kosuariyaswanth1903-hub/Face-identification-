const video = document.getElementById("video")
const result = document.getElementById("result")

Promise.all([
faceapi.nets.tinyFaceDetector.loadFromUri('Models'),
faceapi.nets.faceLandmark68Net.loadFromUri('Models'),
faceapi.nets.faceRecognitionNet.loadFromUri('Models')
]).then(startCamera)

function startCamera(){
navigator.mediaDevices.getUserMedia({video:{}})
.then(stream => {
video.srcObject = stream
})
.catch(err => {
result.innerText = "Camera permission denied"
})
}

async function loadStudents(){

const labels = ['yash','nikhil','charan']

return Promise.all(
labels.map(async label => {

const img = await faceapi.fetchImage(`students/${label}.jpg`)
const detections = await faceapi
.detectSingleFace(img)
.withFaceLandmarks()
.withFaceDescriptor()

return new faceapi.LabeledFaceDescriptors(label,[detections.descriptor])
})
)
}

video.addEventListener("play", async () => {

const labeledDescriptors = await loadStudents()
const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors,0.6)

setInterval(async () => {

const detections = await faceapi
.detectAllFaces(video,new faceapi.TinyFaceDetectorOptions())
.withFaceLandmarks()
.withFaceDescriptors()

if(detections.length>0){

const bestMatch = faceMatcher.findBestMatch(detections[0].descriptor)

if(bestMatch.label !== "unknown"){
result.innerText = bestMatch.label + " belongs to DCME-B"
}else{
result.innerText = "Face not recognised"
}

}

},1000)

})
