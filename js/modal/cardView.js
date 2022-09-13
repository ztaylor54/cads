const cv = require('opencv4nodejs');
const ih = require('../../js/modules/image-helpers.js');

window.document.title = "Card View";

const urlParams = new URLSearchParams(window.location.search);
const files = urlParams.get('files').split(',');

// Get the checkbox for autoscroll
var autoscroll = document.getElementById("autoscrollCheckbox");

// Set the initial modal content
var imgSlider = document.getElementById("modalImageSlider");
var autoscrollSlider = document.getElementById("autoscrollSpeed");
imgSlider.max = files.length - 1;

imgSlider.oninput = function() {
    var filename = files[this.value].replace(/^.*[\\\/]/, '')
    document.getElementById("imageId").innerHTML = filename;
    const newImg = cv.imread(files[this.value]);
    ih.renderImage(newImg, document.getElementById('modalCanvas'));
}

autoscrollSpeed.oninput = function() {
    autoscroll.oninput();
}

imgSlider.oninput();

var interval;

// When the user wants to autoscroll images
autoscroll.oninput = function() {
    clearInterval(interval);
    if (this.checked) {
        interval = setInterval(function() {
            var value = parseInt(imgSlider.value);
            var max = parseInt(imgSlider.max);
            var min = parseInt(imgSlider.min);

            // Cycle back and forth through images
            if (value < max) {
                imgSlider.value = value + 1;
                imgSlider.oninput();
            }
            else if (value == max) {
                imgSlider.value = min;
                imgSlider.oninput();
            }
        }, autoscrollSlider.value);
    }
}
