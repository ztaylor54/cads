let cv = require('./bin/opencv.js')

let runButton = document.getElementById('runButton');
let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('fileInput');
inputElement.addEventListener('change', (e) => {
  imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

// When the button is pressed
runButton.addEventListener('click', function(e) {

  let src = cv.imread(imgElement);
  let dst = new cv.Mat();

  // Get options
  var opts = {};
  opts['ksize'] = parseInt(document.getElementById('ksize').value);
  opts['d']     = parseInt(document.getElementById('d').value);
  opts['sigmaColor'] = parseInt(document.getElementById('sigmaColor').value);
  opts['sigmaSpace'] = parseInt(document.getElementById('sigmaSpace').value);
  opts['threshold1'] = parseInt(document.getElementById('threshold1').value);
  opts['threshold2'] = parseInt(document.getElementById('threshold2').value);
  opts['apertureSize'] = parseInt(document.getElementById('apertureSize').value);
  opts['l2gradient'] = document.getElementById('l2gradient').checked;
  opts['filterType'] = document.getElementById('filterSelect').value;

  console.log(opts);

  // Convert to grayscale
  cv.cvtColor(src, src, cv.COLOR_RGBA2RGB, 0);

  // Apply the selected filter
  switch (opts.filterType) {
    case 'bilateral':
      cv.bilateralFilter(src, dst, opts.d, opts.sigmaColor, opts.sigmaSpace, cv.BORDER_DEFAULT);
    break;
    case 'median':
      cv.medianBlur(src, dst, opts.ksize);
    break;
  }

  // Output
  cv.imshow('out1', dst);

  let out = new cv.Mat();

  // Apply the edge detection
  cv.Canny(dst, out, opts.threshold1, opts.threshold2, opts.apertureSize, opts.l2gradient);

  // Output
  cv.imshow('out2', out);

  src.delete(); dst.delete();

});

// Hide the appropriate form elements
function filterSelected() {
  if (document.getElementById('filterSelect').value == 'bilateral') {
    document.getElementById("medianOpts").style.visibility = "hidden";
    document.getElementById("bilateralOpts").style.visibility = "visible";
  } else {
    document.getElementById("bilateralOpts").style.visibility = "hidden";
    document.getElementById("medianOpts").style.visibility = "visible";
  }
}

function onOpenCvReady() {
  document.getElementById('status').innerHTML = 'OpenCV.js is ready.';
}
function onOpenCvError() {
  let element = document.getElementById('status');
  element.setAttribute('class', 'err');
  element.innerHTML = 'Failed to load opencv.js';
}
