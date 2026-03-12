const video = document.getElementById("video")
const result = document.getElementById("result")

async function start() {

result.innerText = "Loading models..."

await faceapi.nets.tinyFaceDetector.loadFromUri('Models')
await faceapi.nets.faceLandmark68Net.loadFromUri('Models')
await faceapi.nets.faceRecognitionNet.loadFromUri('Models')

result.innerText = "Models loaded. Starting camera..."

const stream = await navigator.mediaDevices.getUserMedia({ video: true })
video.srcObject = stream

video.addEventListener("play", async () => {

const labels = ["yash","nikhil","charan"]

const labeledDescriptors = await Promise.all(
labels.map(async label => {

const img = await faceapi.fetchImage(`students/${label}.jpg`)

const detections = await faceapi
.detectSingleFace(img)
.withFaceLandmarks()
.withFaceDescriptor()

return new faceapi.LabeledFaceDescriptors(label,[detections.descriptor])

})
)

const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors,0.6)

setInterval(async () => {

const detections = await faceapi
.detectAllFaces(video,new faceapi.TinyFaceDetectorOptions())
.withFaceLandmarks()
.withFaceDescriptors()

if(detections.length === 0){
result.innerText = "No face detected"
return
}

const match = faceMatcher.findBestMatch(detections[0].descriptor)

if(match.label === "unknown"){
result.innerText = "Face not recognised"
}
else{
result.innerText = "Detected: " + match.label
}

},1000)

})

}

start()
