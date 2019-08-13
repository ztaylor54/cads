//let cv = require('./bin/opencv.js')
const cv = require('opencv4nodejs');
const ih = require('./js/modules/image-helpers.js');

let base64image

let runButton = document.getElementById('runButton');
let imgElement = document.getElementById('imageSrc');

function encodeImageFileAsURL(element) {
  var file = element.files[0];
  imgElement.src = URL.createObjectURL(file);
  var reader = new FileReader();
  reader.onloadend = function() {
    base64image = reader.result;
  }
  reader.readAsDataURL(file);
}

// When the button is pressed
runButton.addEventListener('click', function(e) {
  let src = ih.decodeImageFromBase64(base64image);
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
  src = src.bgrToGray();

  // Apply the selected filter
  switch (opts.filterType) {
    case 'bilateral':
      dst = src.bilateralFilter(opts.d, opts.sigmaColor, opts.sigmaSpace, cv.BORDER_DEFAULT);
    break;
    case 'median':
      dst = src.medianBlur(opts.ksize);
    break;
  }

  // Output
  ih.renderImage(dst, document.getElementById('out1'));

  let out = new cv.Mat();

  // Apply the edge detection
  out = dst.canny(opts.threshold1, opts.threshold2, opts.apertureSize, opts.l2gradient);

  // Output
  ih.renderImage(out, document.getElementById('out2'));

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
