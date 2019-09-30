// https://github.com/justadudewhohacks/opencv-electron/blob/master/plain-js/app/image-helpers.js
const pngPrefix = 'data:image/jpeg;base64,';
const jpgPrefix = 'data:image/png;base64,';

module.exports = {
  decodeImageFromBase64: function(base64String) {
    var base64Data = base64String.replace(pngPrefix, '').replace(jpgPrefix, '');
    var buffer = Buffer.from(base64Data, 'base64');
    return cv.imdecode(buffer);
  },

  renderImage: function(img, canvas) {
    var matRGBA = img.channels === 1 ? img.cvtColor(cv.COLOR_GRAY2RGBA) : img.cvtColor(cv.COLOR_BGR2RGBA);

    canvas.height = img.rows;
    canvas.width = img.cols;
    var imgData = new ImageData(
      new Uint8ClampedArray(matRGBA.getData()),
      img.cols,
      img.rows
    );
    var ctx = canvas.getContext('2d');
    ctx.putImageData(imgData, 0, 0);
  },

  loadToCanvas: function(element, canvasId) {
    var canvas = document.getElementById(canvasId);
    var ctx = canvas.getContext('2d');
    var img = new Image;
    img.onload = function() {
      ctx.drawImage(img, 0, 0, img.width,    img.height,     // source rectangle
                     0, 0, canvas.width, canvas.height); // destination rectangle
    }
    img.src = URL.createObjectURL(element.files[0]);
  }
};
