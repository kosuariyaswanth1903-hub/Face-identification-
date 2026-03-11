const video = document.getElementById("video")

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("Models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("Models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("Models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("Models")
]).then(startVideo)

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => video.srcObject = stream)
    .catch(err => console.error(err))
}

async function loadLabeledImages() {
  const labels = ["yash", "nikhil", "charan"]

  return Promise.all(
    labels.map(async label => {
      const img = await faceapi.fetchImage(`students/${label}.jpg`)
      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor()

      const descriptions = []
      descriptions.push(detections.descriptor)

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}

video.addEventListener("play", async () => {

  const labeledFaceDescriptors = await loadLabeledImages()
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors)

  const canvas = faceapi.createCanvasFromMedia(video)
  document.body.append(canvas)

  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)

  setInterval(async () => {

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors()

    const resizedDetections = faceapi.resizeResults(detections, displaySize)

    const results = resizedDetections.map(d =>
      faceMatcher.findBestMatch(d.descriptor)
    )

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height)

    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
      drawBox.draw(canvas)
    })

  }, 100)

})
