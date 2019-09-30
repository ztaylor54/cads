const cv = require('opencv4nodejs');
const ih = require('../js/modules/image-helpers.js');

function loadToCanvas(element, canvasId) {
  var canvas = document.getElementById(canvasId);
  var ctx = canvas.getContext('2d');
  var img = new Image;
  img.onload = function() {
    ctx.drawImage(img, 0, 0, img.width,    img.height,     // source rectangle
                   0, 0, canvas.width, canvas.height); // destination rectangle
  }
  img.src = URL.createObjectURL(element.files[0]);
}

function detectFeatures() {
  var img1 = ih.decodeImageFromBase64(document.getElementById('srcImgA').toDataURL());
  var img2 = ih.decodeImageFromBase64(document.getElementById('srcImgB').toDataURL());

  // Convert to grayscale
  img1 = img1.bgrToGray();
  img2 = img2.bgrToGray();

  // Median blur
  img1 = img1.medianBlur(5);
  img2 = img2.medianBlur(5);

  // Check if opencv compiled with extra modules and nonfree
  /*
  if (cv.xmodules.xfeatures2d) {
    const siftMatchesImg = matchFeatures({
      img1,
      img2,
      detector: new cv.SIFTDetector({ nFeatures: 2000 }),
      matchFunc: cv.matchFlannBased
    });
    cv.imshowWait('SIFT matches', siftMatchesImg);
  } else {
    console.log('skipping SIFT matches');
  }
  */

  const orbMatchesImg = matchFeatures({
    img1,
    img2,
    detector: new cv.ORBDetector(),
    matchFunc: cv.matchBruteForceHamming
  });
  // cv.imshowWait('ORB matches', orbMatchesImg);
  ih.renderImage(orbMatchesImg, document.getElementById('orbMatches'));

  // Match using the BFMatcher with crossCheck true
  const bf = new cv.BFMatcher(cv.NORM_L2, true);
  const orbBFMatchIMG = matchFeatures({
      img1,
      img2,
      detector: new cv.ORBDetector(),
      matchFunc: (desc1, desc2) => bf.match(desc1, desc2)
  });
  // cv.imshowWait('ORB with BFMatcher - crossCheck true', orbBFMatchIMG);
  ih.renderImage(orbBFMatchIMG, document.getElementById('orbMatchesCC'));
}

const matchFeatures = ({ img1, img2, detector, matchFunc }) => {
  // detect keypoints
  const keyPoints1 = detector.detect(img1);
  const keyPoints2 = detector.detect(img2);

  // compute feature descriptors
  const descriptors1 = detector.compute(img1, keyPoints1);
  const descriptors2 = detector.compute(img2, keyPoints2);

  // match the feature descriptors
  const matches = matchFunc(descriptors1, descriptors2);

  // only keep good matches
  const bestN = 40;
  const bestMatches = matches.sort(
    (match1, match2) => match1.distance - match2.distance
  ).slice(0, bestN);

  for(var i = 0; i < 10; i++)  {
    // Audit the 10 best matches in console
    console.log(bestMatches[i].distance);
  }

  // Return the average distance between matched descriptors
  let dist = Math.abs(
    bestMatches.reduceRight(
      (acc, curr) => acc + Math.abs(curr.distance),
      0
    ) / bestMatches.length
  );
  console.log("avg distance: " + dist);

  return cv.drawMatches(
    img1,
    img2,
    keyPoints1,
    keyPoints2,
    bestMatches
  );
};

function onOpenCvReady() {
  document.getElementById('status').innerHTML = 'OpenCV.js is ready.';
}
function onOpenCvError() {
  let element = document.getElementById('status');
  element.setAttribute('class', 'err');
  element.innerHTML = 'Failed to load opencv.js';
}
