/*
 * Image preview script
 * powered by jQuery (http://www.jquery.com)
 *
 * written by Alen Grakalic (http://cssglobe.com)
 *
 * for more info visit http://cssglobe.com/post/1695/easiest-tooltip-and-image-preview-using-jquery
 *
 */

window.$ = window.jQuery = require('jquery');

module.exports = {
	imagePreview: function(labels){
		/* CONFIG */

			xOffset = 10;
			yOffset = 30;

			// these 2 variable determine popup's distance from the cursor
			// you might want to adjust to get the right result

		/* END CONFIG */
		$("image.preview").hover(function(e){
			$("body").append("<p id='preview'><img src='"+ e.target.href.baseVal +"' alt='Image preview' /></p>");
			$("#preview")
				.css("top",(e.pageY - xOffset) + "px")
				.css("left",(e.pageX + yOffset) + "px")
				.fadeIn("fast");
	    },
		function(){
			this.title = this.t;
			$("#preview").remove();
	    });
		$("image.preview").mousemove(function(e){
			$("#preview")
				.css("top",(e.pageY - xOffset) + "px")
				.css("left",(e.pageX + yOffset) + "px");
		});
	}
};
