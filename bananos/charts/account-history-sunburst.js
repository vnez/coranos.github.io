// Variables
var width = 1400;
var height = 1400;
var radius = Math.min(width, height) / 2;
var color = d3.scaleOrdinal(d3.schemeCategory20b);

// Get the data from our JSON file
var rootAccount = 'ban_1bananobh5rat99qfgt1ptpieie5swmoth87thi74qgbfrij7dcgjiij94xr';

// zoomable sunburst: https://bl.ocks.org/mbostock/4348373

// changes from https://github.com/d3/d3/blob/master/CHANGES.md

function setNodeNameAndSize(node) {
  if(node.children.length > 0) {
    node.size = 0;
    node.children.forEach(function(child) {
      node.size += child.size;
    });
  }
  node.name = name(node.account) + ' ' + formatBytes3(node.size);
}

function getNodeDataMap(jsonData) {
  const nodeDataMap = {};
  
  jsonData.forEach(function(d) {
    const valueNbr = parseInt(d.balance);
    var child = {};
    child.account = d.account;
    child.name = name(d.account) + ' ' + formatBytes3(d.balance);
    child.size = parseInt(d.balance);
    child.send_history = d.send_history;
    child.children = [];
    if((d.account == rootAccount) || (valueNbr >= crabLimit)) {
      nodeDataMap[d.account] = child;
    }
  });
  return nodeDataMap;
}

function addChildren(nodeDataMap,parentSet,parent,depth) {
  //console.log("addChildren",name(parent.account),depth);
  
  if(depth > 2) {
    return;
  };

  var dustChild = {};
  dustChild.account = 'dust';
  dustChild.size = 0;
  dustChild.children = [];
  dustChild.send_history = [];
  
  for (const [account, balance] of Object.entries(parent.send_history)) {
    if(!parentSet.has(account)) {
      parentSet.add(account);
      if(nodeDataMap.hasOwnProperty(account)) {
        const child = nodeDataMap[account];
        parent.children.push(child);
      } else {
        const valueNbr = parseInt(balance);
        dustChild.size += valueNbr;
      }
    }
  }
  
  if(dustChild.size > dustLimit) {
    setNodeNameAndSize(dustChild);
    parent.children.push(dustChild);
  }
  
  const childDepth = depth + 1;
  parent.children.forEach(function(child) {
      // console.log("addChildren",childDepth,name(parent.account),name(child.account));
      addChildren(nodeDataMap,parentSet,child,childDepth);
  });
  setNodeNameAndSize(parent);
  if(depth == 0) {
    parent.size = 0;
  }
}
    
function onLoad() {
//Size our <svg> element, add a <g> element, and move translate 0,0 to the center of the element.
  d3.select('#chart').selectAll("*").remove();

  var g = d3.select('#chart').append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

  // Create our sunburst data structure and size it.
  var partition = d3.partition()
      .size([2 * Math.PI, radius]);
  
    d3.json('account-history.json', function(response) {
      const nodeDataMap = getNodeDataMap(response.results);
      const rootData = nodeDataMap[rootAccount];
      const parentSet = new Set();
      parentSet.add(rootAccount);
      addChildren(nodeDataMap,parentSet,rootData,0);
      
      const nodeData = {};
      nodeData.children = [];
      nodeData.children.push(rootData);
      
      // Find the root node of our data, and begin sizing process.
      var root = d3.hierarchy(nodeData)
          .sum(function(d) {
              return d.size
          });

      // Calculate the sizes of each arc that we'll draw later.
      partition(root);
      var arc = d3.arc()
          .startAngle(function(d) {
              return d.x0
          })
          .endAngle(function(d) {
              return d.x1
          })
          .innerRadius(function(d) {
              return d.y0 - (d.y1 - d.y0);
          })
          .outerRadius(function(d) {
              return d.y1 - (d.y1 - d.y0);
          });

      //console.log(root);

      // Add a <g> element for each node in thd data, then append <path> elements and draw lines based on the arc
      // variable calculations. Last, color the lines and the slices.
      g.selectAll('g')
          .data(root.descendants())
          .enter().append('g').attr('class', 'node').append('path')
          .attr('display', function(d) {
              return d.depth ? null : 'none';
          })
          .attr('d', arc)
          .on("click", click)
          .style('stroke', '#fff')
          .style('fill', function(d) {
              var colorKey = (d.data.children ? d : d.parent).data.name;
              //console.log(colorKey);
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
          .attr('dy', '.5em') // rotation align
          .text(function(d) {
              return d.parent ? d.data.name : ''
          });

      function click(d) {
        //console.log("click",d.data.account);
        rootAccount = d.data.account;
        onLoad();
      }
  });

  /**
   * Calculate the correct distance to rotate each label based on its location in the sunburst.
   * 
   * @param {Node}
   *          d
   * @return {Number}
   */
  function computeTextRotation(d) {
      var angle = (d.x0 + d.x1) / Math.PI * 90;

      if(rootAccount == d.data.account) {
        return 0;
      }
      
      // Avoid upside-down labels
      // return (angle < 120 || angle > 270) ? angle : angle + 180; // labels as rims
      return (angle < 180) ? angle - 90 : angle + 90; // labels as spokes
  }
}