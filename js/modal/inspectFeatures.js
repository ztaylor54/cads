const cv = require('opencv4nodejs');
const ih = require('../../js/modules/image-helpers.js');
const fs = require('fs');
const path = require('path');
const remote = require('electron').remote;

const fullpath = remote.getGlobal('shared').featureInspectImage;
const src = cv.imread(fullpath);
const blurRadius = remote.getGlobal('shared').blurRadius;
const featureRadius = remote.getGlobal('shared').featureRadius;

window.document.title = "Inspect Features - " + fullpath.replace(/^.*[\\\/]/, '');

var gray = src.bgrToGray();
gray = src.medianBlur(blurRadius);

// Detect features
detector = new cv.ORBDetector();
const keyPoints = detector.detect(gray);

// Ignore keypoints outside user-defined radius
var center = new cv.Point(src.rows/2, src.cols/2);
var radius = featureRadius;

// Iterate through all keypoints & omit if distance from center is too great
var filteredKeyPoints = keyPoints.filter(kp => {
  // Is this keypoint within the user-defined feature radius?
  return center.sub(kp.pt).norm() <= radius
});

// Shows keypoints over image
const mat = cv.drawKeyPoints(src, filteredKeyPoints);

ih.renderImage(mat, document.getElementById('imgCanvas'));
