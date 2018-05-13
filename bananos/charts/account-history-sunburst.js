// Variables
var width = 1800;
var height = 1800;
var radius = Math.min(width, height) / 2;
var color = d3.scaleOrdinal(d3.schemeCategory20b);

// zoomable sunburst: https://bl.ocks.org/mbostock/4348373

// changes from https://github.com/d3/d3/blob/master/CHANGES.md

function onLoad() {
    d3.json('account-history.json', function(response) {
      loadDataMap(response);      
      showChart();
    });
}

function showChart() {
  //console.log('rootAccount',rootAccount);
  const rootData = nodeDataMap[rootAccount];
  //console.log(rootData);
  d3.select('#chart').selectAll("*").remove();
  d3.select('#rootName').html(rootAccount + " " + rootData.name);

  // Size our <svg> element, add a <g> element, and move translate 0,0 to the center of the element.
  var g = d3.select('#chart').append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

  // Create our sunburst data structure and size it.
  var partition = d3.partition()
      .size([2 * Math.PI, radius]);
  
  const nodeData = copyNode(rootData,5);
  
  //console.log(nodeData); 
  
  // Find the root node of our data, and begin sizing process.
  var root = d3.hierarchy(nodeData)
      .sum(function(d) {
          return d.size;
      })
      .sort(function(a, b) { return b.size - a.size; });

  // Calculate the sizes of each arc that we'll draw later.
  partition(root);
  var arc = d3.arc()
      .startAngle(function(d) {
          return d.x0;
      })
      .endAngle(function(d) {
          return d.x1;
      })
      .innerRadius(function(d) {
          return d.y0;
          //return d.y0 - (d.y1 - d.y0);
      })
      .outerRadius(function(d) {
          return d.y1;
          //return d.y1 - (d.y1 - d.y0);
      });

  // console.log(root);

  // Add a <g> element for each node in thd data, then append <path> elements and draw lines based on the arc
  // variable calculations. Last, color the lines and the slices.
  g.selectAll('g')
      .data(root.descendants())
      .enter().append('g').attr('class', 'node').append('path')
      .attr('d', arc)
      .on("click", click)
      .style('stroke', '#fff')
      .style('fill', function(d) {
          var colorKey = (d.data.children ? d : d.parent).data.name;
          // console.log(colorKey);
          return color(colorKey);
      });


  // Populate the <text> elements with our data-driven titles.
  g.selectAll('g')
      .append('text')
      .on("click", click)
      .attr('class', 'titles')
      .attr('transform', function(d) {
          return 'translate(' + arc.centroid(d) + ')rotate(' + computeTextRotation(d) + ')';
      })
      .attr('dx', '-80') // radius margin
      .attr('dy', '-.5em') // rotation align
      .html(function(d) {
          return d.data.name[0];
      });

  g.selectAll('g')
      .append('text')
      .on("click", click)
      .attr('class', 'titles')
      .attr('transform', function(d) {
          return 'translate(' + arc.centroid(d) + ')rotate(' + computeTextRotation(d) + ')';
      })
      .attr('dx', '-80') // radius margin
      .attr('dy', '+.5em') // rotation align
      .html(function(d) {
          return d.data.name[1];
      });
  function click(d) {
    // console.log("click",d.data.account);
    if(rootAccount == d.data.account) {
      rootAccount = genesisAccount;      
    } else {
      rootAccount = d.data.account;
    }
    showChart();
  }
}

/**
 * Calculate the correct distance to rotate each label based on its location in the sunburst.
 * 
 * @param {Node}
 *          d
 * @return {Number}
 */
function computeTextRotation(d) {
    var angle = ((d.x0 + d.x1) / Math.PI * 90) % 360;

    //console.log(d.data.name,angle)
    
    if(d.parent == undefined) {
      return 0;
    }
    
    // Avoid upside-down labels
    // return (angle < 120 || angle > 270) ? angle : angle + 180; // labels as rims
    return (angle < 180) ? angle - 90 : angle + 90; // labels as spokes
}
