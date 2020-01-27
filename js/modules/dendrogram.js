// Module to draw a dendrogram using d3
const d3 = require('d3');
const preview = require('./preview.js')
const ih = require('../../js/modules/image-helpers.js');
const cv = require('opencv4nodejs');

module.exports = {
  drawDendrogram: function(divId, data, labels, rootDir) {

//DEBUG:::
  const vpHeight = 400;
  const vpWidth  = 700;
  const height = data.size * 25;
  const width  = data.size * 10;
  const radius = 6;

  // Main svg viewport
  const svg = d3.select(divId)
      .append("svg");
      //.attr("viewBox", [0, 0, vpWidth, vpHeight]);

  // Main graph container
  const g = svg.append("g")
      .attr("class", "circles");

  // // Main graph style
  // g.append("style").text(`
  //   .circles {
  //     stroke: transparent;
  //     stroke-width: 1.5px;
  //   }
  //   .circles circle:hover {
  //     stroke: black;
  //   }
  // `);

  // Main graph style
  g.append("style").text(`
    .circles {
      stroke: transparent;
      stroke-width: 1.5px;
    }
    .circles circle:hover {
      stroke: black;
    }
    .link {
      fill: none;
      stroke: #ccc;
      stroke-width: 2px;
    }
    .node circle {
      fill: #fff;
      stroke: steelblue;
      stroke-width: 3px;
    }
  `);

  svg.call(d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0, 25])
      .on("zoom", zoomed))
      .on("dblclick.zoom", null); // disable double-click zoom

  function mousedowned(d, i) {
    d3.select(this).transition()
        .attr("fill", "black")
        .attr("r", radius * 2)
      .transition()
        .attr("fill", "#69b3a2")
        .attr("r", radius);
  }

  function zoomed() {
    g.attr("transform", d3.event.transform);
  }


    // Create the cluster layout:
    // var cluster = d3.cluster()
    //   .size([height, width - 300]);  // 100 is the margin I will have on the right side

    var i = 0,
    duration = 750,
    root;

    var treemap = d3.cluster().size([height, width]);

    // Give the data to this cluster layout:
    root = d3.hierarchy(data, function(d) {
        return d.children;
    });
    root.x0 = height / 2;
    root.y0 = 0;

    // root.children.forEach(collapse);

    update(root);

    // // Add the links between nodes:
    // g.selectAll('path')
    //   .data( root.descendants().slice(1) )
    //   .enter()
    //   .append('path')
    //   .attr("d", function(d) {
    //       return "M" + d.y + "," + d.x
    //               + "C" + (d.parent.y + 50) + "," + d.x
    //               + " " + (d.parent.y + 150) + "," + d.parent.x // 50 and 150 are coordinates of inflexion, play with it to change links shape
    //               + " " + d.parent.y + "," + d.parent.x;
    //             })
    //   .style("fill", 'none')
    //   .attr("stroke", '#ccc')

    // // Add a circle for each node:
    // const node = g.selectAll("g")
    //   .data(root.descendants())
    //   .enter()
    //   .append("g")
    //   .attr("transform", function(d) {
    //       return "translate(" + d.y + "," + d.x + ")"
    //   })
    //   .append("circle")
    //     .attr("r", radius)
    //     .style("fill", "green");

    // // Add labels to the leaves:
    // node.filter(function(d) {
    //     return d.data.index > -1
    //   }).append("text")
    //     .attr("dx", function(d) { return d.children ? 8 : 60; })
    //     .attr("dy", function(d) { return d.children ? 20 : 4; })
    //     .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
    //     .text(function(d) { return d.children ? "node" + d.height : "" + labels[d.data.index]; });

    // // Add icon images:
    // node.filter(function(d) {
    //     return d.data.index > -1
    //   }).append("svg:image")
    //     .attr('x', 15)
    //     .attr('y', -12)
    //     .attr('width', 30)
    //     .attr('height', 30)
    //     .attr("xlink:href", function(d) {
    //       return path.join(rootDir, labels[d.data.index]);
    //     })

    // Collapse the node and all its children
    function collapse(d) {
      if(d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    }

    function update(source) {

      // Assigns the x and y position for the nodes
      var treeData = treemap(root);

      // Compute the new tree layout
      var nodes = treeData.descendants(),
          links = treeData.descendants().slice(1);

      // Normalize for fixed-depth
      nodes.forEach(function(d){ d.y = d.depth * 180});

      // **** Nodes section ****
      // Update the nodes...
      var node = g.selectAll('g.node')
          .data(nodes, function(d) {return d.id || (d.id = ++i); });

      // Enter any new modes at the parent's previous position.
      var nodeEnter = node.enter().append('g')
          .attr('class', 'node')
          .attr("transform", function(d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on('click', click);

      // Add node inspection functionality
      nodeEnter.on('dblclick', nodeInspectionModal);

      // Add Circle for the nodes
      nodeEnter.append('circle')
          .attr('class', 'node')
          .attr('r', radius)
          .style("fill", function(d) {
              return d._children ? "lightsteelblue" : "#e0e0e0";
          });

      // Add labels for the nodes
      nodeEnter.append('text')
          .attr("dy", ".35em")
          .attr("x", function(d) {
              return d.children || d._children ? -15 : 40;
          })
          .attr("text-anchor", function(d) {
              return d.children || d._children ? "end" : "start";
          })
          .text(function(d) { return d.children ? d.data.height.toFixed(2) : "" + labels[d.data.index]; });

      // Add icon images to leaf nodes
      nodeEnter.filter(function(d) {
            return d.data.index > -1
        }).append("svg:image")
            .attr('x', 15)
            .attr('y', -10)
            .attr('width', 20)
            .attr('height', 20)
            .attr('class', 'preview')
            .attr("xlink:href", function(d) {
              return path.join(rootDir, labels[d.data.index]);
          });

      // Update image hover
      preview.imagePreview(labels);

      // UPDATE
      var nodeUpdate = nodeEnter.merge(node);

      // Transition to the proper position for the node
      nodeUpdate.transition()
        .duration(duration)
        .attr("transform", function(d) {
            return "translate(" + d.y + "," + d.x + ")";
         });

      // Update the node attributes and style
      nodeUpdate.select('circle.node')
        .attr('r', radius)
        .style("fill", function(d) {
            return d._children ? "lightsteelblue" : "#fff";
        })
        .attr('cursor', 'pointer')
        .on("mouseover", function(d,i) {
          d3.select(this).transition()
            .ease(d3.easeBounce)
            .duration("500")
            .attr("r", radius * 1.5);
        })
        .on("mouseout", function(d,i) {
          d3.select(this).transition()
            .ease(d3.easeQuad)
            .delay("100")
            .duration("200")
            .attr("r", radius)
        });


      // Remove any exiting nodes
      var nodeExit = node.exit().transition()
          .duration(duration)
          .attr("transform", function(d) {
              return "translate(" + source.y + "," + source.x + ")";
          })
          .remove();

      // On exit reduce the node circles size to 0
      nodeExit.select('circle')
        .attr( 1e-6);

      // On exit reduce the opacity of text labels
      nodeExit.select('text')
        .style('fill-opacity', 1e-6);

      // ****************** links section ***************************

      // Update the links...
      var link = g.selectAll('path.link')
          .data(links, function(d) { return d.id; });

      // Enter any new links at the parent's previous position.
      var linkEnter = link.enter().insert('path', "g")
          .attr("class", "link")
          .attr('d', function(d){
            var o = {x: source.x0, y: source.y0}
            return diagonal(o, o)
          });

      // UPDATE
      var linkUpdate = linkEnter.merge(link);

      // Transition back to the parent element position
      linkUpdate.transition()
          .duration(duration)
          .attr('d', function(d){ return diagonal(d, d.parent) });

      // Remove any exiting links
      var linkExit = link.exit().transition()
          .duration(duration)
          .attr('d', function(d) {
            var o = {x: source.x, y: source.y}
            return diagonal(o, o)
          })
          .remove();

      // Store the old positions for transition.
      nodes.forEach(function(d){
        d.x0 = d.x;
        d.y0 = d.y;
      });

      // Creates a curved (diagonal) path from parent to the child nodes
      function diagonal(s, d) {

        var path = `
            M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}
        `;

        return path;
      }

      // Toggle children on click.
      function click(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
        update(d);
      }

      // Bring up node inspection modal
      function nodeInspectionModal(d) {
          if(d.children) {
              // Get the modal
              var modal = document.getElementById("nodeInspectionModal");

              // Get the <span> element that closes the modal
              var span = document.getElementsByClassName("close")[0];

              // Get the checkbox for autoscroll
              var autoscroll = document.getElementById("autoscrollCheckbox");

              // Set the initial modal content
              var imgSlider = document.getElementById("modalImageSlider");
              var autoscrollSlider = document.getElementById("autoscrollSpeed");
              imgSlider.max = d.data.members.length - 1;

              imgSlider.oninput = function() {
                  document.getElementById("imageId").innerHTML = labels[d.data.members[this.value]];
                  const newImg = cv.imread(path.join(rootDir, labels[d.data.members[this.value]]));
                  ih.renderImage(newImg, document.getElementById('modalCanvas'));
              }

              autoscrollSpeed.oninput = function() {
                  autoscroll.oninput();
              }

              imgSlider.oninput();

              // Open the modal
              modal.style.display = "block";

              var interval;

              // When the user clicks on <span> (x), close the modal
              span.onclick = function() {
                  modal.style.display = "none";
                  clearInterval(interval);
                  autoscroll.checked = false;
              }

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

              // When the user clicks anywhere outside of the modal, close it
              window.onclick = function(event) {
                  if (event.target == modal) {
                    clearInterval(interval);
                    autoscroll.checked = false;
                    modal.style.display = "none";
                  }
              }
          }
      }

      // Handle partitioning
      const partitionInput = document.getElementById("partitionThreshold");
      const partitionButton = document.getElementById("partitionButton");

      partitionButton.onclick = function() {
          console.log("TODO DIE PARTITIONING");
      }
    }
  }
};
