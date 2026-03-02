const video = document.getElementById('video');
const result = document.getElementById('result');

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('models')
]).then(startVideo);

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => console.error(err));
}

video.addEventListener('play', async () => {

  const labeledDescriptors = await loadLabeledImages();
  const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

  setInterval(async () => {

    const detections = await faceapi.detectAllFaces(
      video,
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks().withFaceDescriptors();

    if (detections.length > 0) {

      const bestMatch = faceMatcher.findBestMatch(
        detections[0].descriptor
      );

      if (bestMatch.label === "Yash") {
        result.innerText = "This person belongs to DCME-B Section";
      } else {
        result.innerText = "Unknown Person";
      }
    }

  }, 1000);
});

async function loadLabeledImages() {

  const labels = ["Yash"];

  return Promise.all(
    labels.map(async label => {
      const img = await faceapi.fetchImage(`students/${label.toLowerCase()}.jpg`);
      const detection = await faceapi.detectSingleFace(
        img,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptor();

      return new faceapi.LabeledFaceDescriptors(
        label,
        [detection.descriptor]
      );
    })
  );
}
