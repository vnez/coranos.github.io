// Variables
var width = 1000;
var height = 1000;

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
    w: 150, h: 30, s: 3, t: 10
};

var x = d3.scaleLinear()
    .range([0, width]);

var y = d3.scaleLinear()
    .range([0, height]);

var color = d3.scaleOrdinal(d3.schemeCategory20c);

// Get the data from our JSON file
const genesisAccount = 'ban_1bananobh5rat99qfgt1ptpieie5swmoth87thi74qgbfrij7dcgjiij94xr';

var rootAccount = genesisAccount;

var url = new URL(window.location);
var accountUrlParam = url.searchParams.get("account");
if (accountUrlParam != undefined) {
  rootAccount = accountUrlParam;
}


const nodeDataMap = {};

function getNodeDataMap(jsonData) {
  if(Object.keys(nodeDataMap).length > 0) {
    return nodeDataMap;
  }
  
  jsonData.forEach(function(d) {
    var child = {};
    child.account = d.account;
    child.balance = parseInt(d.balance);
    child.history = d.history;
    child.children = [];
    child.size = child.balance;
    child.balance_sent = 0;
    for (const [account, balance] of Object.entries(child.history)) {
      if(account != child.account) {
        child.balance_sent += parseInt(balance);
      }
    }
    child.name = [];
    child.name.push(name(child.account) + '=' + formatBytes3(child.balance));
    child.name.push('sent ' + formatBytes3(child.balance_sent));
    // console.log(name(child.account) , formatBytes3(child.size));
    nodeDataMap[d.account] = child;
  });
  return nodeDataMap;
}

function addChildren(nodeDataMap,ancestorSet,parentFrontierSet,depth) {
  console.log("addChildren",depth,parentFrontierSet.size);
//  console.log("addChildren",ancestorSet,parentFrontierSet,depth);
  const childFrontierSet = new Set();
  
  const childDepth = depth + 1;

  if(parentFrontierSet.size == 0 ) {
    return;
  }
  
//  if(childDepth > 6) {
//    return;
//  }
  
  parentFrontierSet.forEach(function(parentAccount) {
      const parent = nodeDataMap[parentAccount];
      for (const [childAccount, balance] of Object.entries(parent.history)) {
        if(nodeDataMap.hasOwnProperty(childAccount)) {
          const child = nodeDataMap[childAccount];          
          if(!ancestorSet.has(childAccount)) {
            if(!parentFrontierSet.has(childAccount)) {
              if(child.childDepth == undefined) {
                parent.children.push(child);
                child.childDepth = childDepth;
                child.name.push(childDepth);
                childFrontierSet.add(childAccount);
              }
            }
          }
        }
      }
      ancestorSet.add(parentAccount);
  });

  addChildren(nodeDataMap,ancestorSet,childFrontierSet,childDepth);
}


function getSize(node) {
  if(node.children.length == 0) {
    return node.balance + node.balance_sent;
  } else {
    return undefined;
  }
}

function copyNode(node,depth) {
  const copy = {};
  copy.name = node.name;
  copy.account = node.account;
  copy.balance = node.balance;
  copy.balance_sent = node.balance_sent;
  copy.size = node.size;
  copy.children = [];
  if(depth == 0) {
    return copy;
  }
  node.children.forEach(function(child) {
    const childCopy = copyNode(child,depth-1);
    childCopy.parent = node;
    copy.children.push(childCopy);
  });
  copy.size = getSize(copy);
  // copy.name = name(copy.account) + ' ' + formatBytes3(copy.size);
  return copy;
}

function onLoad() {
    d3.json('account-history.json', function(response) {
      const nodeDataMap = getNodeDataMap(response.results);
      const rootData = nodeDataMap[rootAccount];
      const ancestorSet = new Set();
      const parentFrontierSet = new Set();
      ancestorSet.add(rootAccount);
      parentFrontierSet.add(rootAccount);
      addChildren(nodeDataMap,ancestorSet,parentFrontierSet,0);
      
      showIcicles();
    });
}

function showIcicles() {
  // console.log('rootAccount',rootAccount);
  const rootData = nodeDataMap[rootAccount];
  
  const nodeData = copyNode(rootData,nodeDataMap.length);
  
  // console.log(rootData);
  d3.select('#icicle').selectAll("*").remove();
  d3.select('#rootName').html(rootAccount + " " + rootData.name);
    
  var x = d3.scaleLinear()
    .range([0, width]);
  
  var y = d3.scaleLinear()
    .range([0, height]);
  
  var color = d3.scaleOrdinal(d3.schemeCategory20c);
  
  var vis = d3.select('#icicle').append("svg")
    .attr("width", width)
    .attr("height", height)
  
  var partition = d3.partition()
    .size([width, height])
    .padding(0)
    .round(true);
  
  var rect = vis.selectAll("rect");
  var fo = vis.selectAll("foreignObject");
  var totalSize=0;

  var root = d3.hierarchy(nodeData)
      .sum(function(d) {
          return d.size;
      })
      .sort(function(a, b) { return b.size - a.size; });
  
  partition(root);
  
  rect = rect
      .data(root.descendants())
    .enter().append("rect")
      .attr("x", function(d) { return d.x0; })
      .attr("y", function(d) { return d.y0; })
      .attr("width", function(d) { return d.x1 - d.x0; })
      .attr("height", function(d) { return d.y1 - d.y0; })
      .style('fill', function(d) {
          var colorKey = (d.data.children ? d : d.parent).data.name;
          // console.log(colorKey);
          return color(colorKey);
      })
      .on("mouseover", mouseover)
      .on("click", click);
    
  fo = fo
    .data(root.descendants())
    .enter().append("foreignObject")
      .attr("x", function(d) { return d.x0; })
      .attr("y", function(d) { return d.y0; })
      .attr("width", function(d) { return d.x1 - d.x0; })
      .attr("height", function(d) { return d.y1 - d.y0; })
     .style("cursor", "pointer")
     .text(function(d) { return d.data.name})
     .on("mouseover", mouseover)
     .on("click", click);
}

function mouseover(d) {
  // console.log("mouseover",d.data.name);
  d3.select('#mouseover').html(d.data.name);
}

function click(d) {
  // console.log("click",d.data.account);
  if(rootAccount == d.data.account) {
    rootAccount = genesisAccount;      
  } else {
    rootAccount = d.data.account;
  }
  showIcicles();
}

