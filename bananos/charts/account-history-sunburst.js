function onLoad() {
    // Variables
    var width = 1200;
    var height = 1200;
    var radius = Math.min(width, height) / 2;
    var color = d3.scaleOrdinal(d3.schemeCategory20b);

    // Size our <svg> element, add a <g> element, and move translate 0,0 to the center of the element.
    var g = d3.select('#chart').append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    // Create our sunburst data structure and size it.
    var partition = d3.partition()
        .size([2 * Math.PI, radius]);

    // Get the data from our JSON file
    const tier0Set = new Set();
    tier0Set.add('ban_1bananobh5rat99qfgt1ptpieie5swmoth87thi74qgbfrij7dcgjiij94xr');
    tier0Set.add('ban_3fundbxxzrzfy3k9jbnnq8d44uhu5sug9rkh135bzqncyy9dw91dcrjg67wf');
    tier0Set.add('ban_1fundm3d7zritekc8bdt4oto5ut8begz6jnnt7n3tdxzjq3t46aiuse1h7gj');
    
    // zoomable sunburst: https://bl.ocks.org/mbostock/4348373

    // changes from https://github.com/d3/d3/blob/master/CHANGES.md
    
    d3.json('account-history.json', function(response) {
        var nodeData = {};
        nodeData.children = [];

        response.results.sort(function(a, b) {
            return parseInt(b.balance) - parseInt(a.balance);
        });

        var dustChild = {};
        dustChild.name = 'dust';
        dustChild.size = 0;
        dustChild.children = [];

        const tier1Set = new Set();
        response.results.forEach(function(d) {
          if(tier0Set.has(d.account)) {
            for (const [account, balance] of Object.entries(d.send_history)) {
              tier1Set.add(account);
            }
          }
        });
        
        const tier1Map = {};

        // add all the accounts over the cutoff point, list everything else as dust.
        response.results.forEach(function(d) {
          if(!tier0Set.has(d.account) && !(tier1Set.has(d.account))) {
            const valueNbr = parseInt(d.balance);
            var child = {};
            child.name = name(d.account) + ' ' + formatBytes3(d.balance);
            child.size = parseInt(d.balance);
            child.children = [];
            if (valueNbr >= crabLimit) {
              nodeData.children.push(child);
              tier1Map[d.account] = child;
            } else {
              dustChild.size += valueNbr;
              if (valueNbr >= dustlimit) {
                dustChild.children.push(child);
              }
            }
          }
        });
        
        // for all the accounts over the cutoff, list their history. receive_history
        response.results.forEach(function(d) {
          for (const [account, balance] of Object.entries(d.send_history)) {
            if (tier1Map.hasOwnProperty(account)) {
              const tier1Parent = tier1Map[account];
              var child = {};
              child.name = name(d.account) + ' ' + formatBytes3(balance);
              child.size = parseInt(balance);
              child.children = [];
              tier1Parent.children.push(child);
            }
          }
        });
        
        if (dustChild.size > 0) {
          dustChild.name +=  ' ' + formatBytes3(dustChild.size);
          nodeData.children.push(dustChild);
        }
        
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
                return d.y0
            })
            .outerRadius(function(d) {
                return d.y1
            });


        // Add a <g> element for each node in thd data, then append <path> elements and draw lines based on the arc
        // variable calculations. Last, color the lines and the slices.
        g.selectAll('g')
            .data(root.descendants())
            .enter().append('g').attr('class', 'node').append('path')
            .attr('display', function(d) {
                return d.depth ? null : 'none';
            })
            .attr('d', arc)
            .style('stroke', '#fff')
            .style('fill', function(d) {
                var colorKey = (d.data.children ? d : d.parent).data.name;
                //console.log(d.data.name,d.data.children,colorKey);
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
          console.log("click",d.data.name);
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

        // Avoid upside-down labels
        // return (angle < 120 || angle > 270) ? angle : angle + 180; // labels as rims
        return (angle < 180) ? angle - 90 : angle + 90; // labels as spokes
    }
}