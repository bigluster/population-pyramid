define(["jquery", "text!./populationpyramid.css","./d3.min"], function($, cssContent) {'use strict';
	$("<style>").html(cssContent).appendTo("head");
	return {
		initialProperties : {
			version: 1.0,
			qHyperCubeDef : {
				qDimensions : [],
				qMeasures : [],
				qInitialDataFetch : [{
					qWidth : 5,
					qHeight : 1000
				}]
			}
		},
		definition : {
			type : "items",
			component : "accordion",
			items : {
				dimensions : {
					uses : "dimensions",
					min : 1,
					max : 1 
				},
				measures : {
					uses : "measures",
					min : 2,
					max : 5
				},
				sorting : {
					uses : "sorting"
				},
				settings : {
					uses : "settings",
					items: {
						leftColor: {
							ref: "leftColor",
							label: "Left Color (Hex)",
							type: "string",
							defaultValue: "#0080FF"
						}, 
						rightColor: {
								ref: "rightColor",
								type: "string",
								label: "Right Color (Hex)",
								defaultValue: "#cc99ff"
						},
						percentFormat: {
								ref: "percentFormat",
								type: "boolean",
								label: "Percent Format",
								defaultValue: false
						}
					}
					
				}
			}
		},
		snapshot : {
			canTakeSnapshot : true
		},
		paint : function($element,layout) {
			console.log($element);
			console.log(layout);
			
			self = this;
			
			var leftColor = this.backendApi.model.layout.leftColor;
			
			var rightColor = this.backendApi.model.layout.rightColor;
			
			var percentFormat = this.backendApi.model.layout.percentFormat;
          
			//Get qMatrix data array
			var qMatrix = layout.qHyperCube.qDataPages[0].qMatrix;
			
          	
          	//Create new array that contains the dimension labels
            var dimensionLabels = layout.qHyperCube.qDimensionInfo.map(function(d) {
              return d.qFallbackTitle;
            });
          
          	//Create new array that contains the measure labels
          	var measureLabels = layout.qHyperCube.qMeasureInfo.map(function(d) {
          		return d.qFallbackTitle;
          	});
            
			var hasD3 = false;
			var hasD4 = false;
			
          	//Create a new array for our extension with a row for each row in the qMatrix
          	var data = qMatrix.map(function (d){
          		//for each element in the matrix, create a new object that has a property
              	//for the grouping dimension, the first metric, and the second metric
				var d3;
				var d4;
				
				
				if (d[3]) {
					d3 = d[3].qNum;
					hasD3 = true;
				}
				if (d[4]) {
					d4 = d[4].qNum;
					hasD4 = true;
				}
              return {
                "Dim1":d[0].qText,
                "Metric1":d[1].qNum,
                "Metric2":d[2].qNum,
				"Metric3":d3,
                "Metric4":d4,
				"dimensionid":d[0].qIsOtherCell ? null : d[0].qElemNumber
              }
            });
			
          // Chart object width
          var width = $element.width();
          // Chart object height
          var height = $element.height();
          // Chart object id
          var id = "container_" + layout.qInfo.qId;
          
          //Check to see if the chart element has already been created
          if(document.getElementById(id)){
            //if it has been created, empty its content so we can redraw it
            $("#" + id).empty();
          }
          else{
            //if it hasn't been created, create it with the appropriate id and size
            $element.append($('<div />').attr("id", id).width(width).height(height));
          }
          
          vizDoublePyramid(data,dimensionLabels,measureLabels,width,height,id,hasD3,hasD4,leftColor,rightColor,percentFormat);
          
		  $element.find('.selectable').on('qv-activate', function() {
				if(this.hasAttribute("data-value")) {
					console.log(this.getAttribute("data-value"));
					var value = parseInt(this.getAttribute("data-value"), 10), dim = 0;
					console.log("Value: " + value);
					self.selectValues(dim, [value], true);
		
					$element.find( "[data-value=" + value + "]" ).attr("class","selected" );
					console.log($element.find( "[data-value=" + value + "]" ));
				}
			});
        }
	};
});

var vizDoublePyramid = function(data,dimensionLabels,measureLabels,width,height,id,hasD3,hasD4,leftColor,rightColor,percentFormat){
	var margin = {top: 20, right: 30, bottom: 30, left: 30, middle: 0},
    //Width and Height values
    width = width - margin.left - margin.right,
	height = height - margin.top - margin.bottom;
	
	// the width of each side of the chart
	var regionWidth = width/2 - margin.middle;
	
	// these are the x-coordinates of the y-axes
	var pointA = regionWidth,
		pointB = width - regionWidth;

 
    //Scale for names
  	var x = d3.scale.linear()
    	.range([0, regionWidth]);
		
	var xLeft = d3.scale.linear()
    	.range([regionWidth, 0]);
		
	var xRight = d3.scale.linear()
    	.range([0, regionWidth]);
     
    var y = d3.scale.ordinal()
        .rangeBands([height-30, 0]);
     
    var color = d3.scale.category10();
     
    var xAxisRight = d3.svg.axis()
        .scale(xRight)
        .orient("bottom");
	

	var xAxisLeft = d3.svg.axis()
        .scale(xLeft)
        .orient("bottom");
		
	if (percentFormat) {
		xAxisLeft.tickFormat(d3.format('%'));
		xAxisRight.tickFormat(d3.format('%'));;
	}
     
    var yAxisLeft = d3.svg.axis()
        .scale(y)
        .orient("right")
		.tickFormat('')
		.tickSize(4,0)
		.tickPadding(margin.middle-4);;
		
	var yAxisRight = d3.svg.axis()
        .scale(y)
        .orient("right")
		.tickSize(0,1);
    	
  	//Get names from data matrix
    var names = data.map(function(d){
      return d.Dim1;
    });

    y.domain(names);
	var max1 = d3.max(data, function(d) { return d.Metric1; });
	var max2 = d3.max(data, function(d) { return d.Metric2; });
	var maxValue = d3.max([max1, max2]);
	
	var min1 = d3.min(data, function(d) { return d.Metric1; });
	var min2 = d3.min(data, function(d) { return d.Metric2; });
	var minValue = d3.min([min1, min2]);
    x.domain([0, maxValue]).nice();
	xLeft.domain([0, maxValue]).nice();
	xRight.domain([0, maxValue]).nice();
	
	
	
  
  	var barWidth = (height - names.length*10)/names.length;
  	var miniBarWidthPercent = 0.6;
  	var miniBarWidth = barWidth * miniBarWidthPercent;
  
  	//Append new element to the div container we just created
    var svg = d3.select("#"+id).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      	.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	// MAKE GROUPS FOR EACH SIDE OF CHART
	// scale(-1,1) is used to reverse the left side so the bars grow left instead of right
	var leftBarGroup = svg.append('g')
		.attr('transform', "translate(" + pointA + ", 0)" + 'scale(-1,1)');
		
	var rightBarGroup = svg.append('g')
		.attr('transform', "translate(" + pointB + ", 0)");
  	
	var leftBarGroup2 = svg.append('g')
		.attr('transform', "translate(" + pointA + ", 0)" + 'scale(-1,1)');
	var rightBarGroup2 = svg.append('g')
		.attr('transform', "translate(" + pointB + ", 0)");
	
	// Draw Labels
	if (hasD3){
		svg.append("g")
		.attr("class", "y axis left label")
		.attr("transform", "translate(0, 0)")
		.append("text")
		.style("text-anchor", "start")
		.style("fill", leftColor)
		.attr("fill-opacity", 0.3)
		.text(measureLabels[0]);
	} else {
		svg.append("g")
		.attr("class", "y axis left label")
		.attr("transform", "translate(0, 0)")
		.append("text")
		.style("text-anchor", "start")
		.style("fill", leftColor)
		.text(measureLabels[0]);
	}
	
	if (hasD4){
		svg.append("g")
		.attr("class", "y axis right label")
		.attr("id", "test")
		.attr("transform", "translate(" + width + ", 0)")
		.append("text")
		.style("text-anchor", "end")
		.style("fill", rightColor)
		.attr("fill-opacity", 0.3)
		.text(measureLabels[1]);
	} else {
		svg.append("g")
		.attr("class", "y axis right label")
		.attr("id", "test")
		.attr("transform", "translate(" + width + ", 0)")
		.append("text")
		.style("text-anchor", "end")
		.style("fill", rightColor)
		.text(measureLabels[1]);
	}
	svg.append("g")
    .attr("class", "y axis left label")
    .attr("transform", "translate(0, 20)")
    .append("text")
	.style("text-anchor", "start")
	.style("fill", leftColor)
	.text(measureLabels[2]);
	
    svg.append("g")
    .attr("class", "y axis right label")
	.attr("id", "test")
    .attr("transform", "translate(" + width + ", 20)")
    .append("text")
	.style("text-anchor", "end")
	.style("fill", rightColor)
	.text(measureLabels[3]);
	
	
	// Draw Axes	
    svg.append("g")
    .attr("class", "x axis left")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxisLeft);
	
	svg.append("g")
    .attr("class", "x axis right")
    .attr("transform", "translate(" + pointB + "," + height + ")")
    .call(xAxisRight);
    
    svg.append("g")
    .attr("class", "y axis left")
    .call(yAxisLeft)
    .append("text")
    .attr("transform", "translate(" + pointA + ",30)");
	
  
  	svg.append("g")
    .attr("class", "y axis right")
    .call(yAxisRight)
    .attr("transform", "translate(" + pointB + ",30)");
    
	// Draw Bar
	
	if(hasD3){
		leftBarGroup.selectAll('.bar.left')
		.data(data)
		.enter().append('rect')
		.attr('class', 'bar left')
		.attr('x', 0)
		.attr('y', function(d) { return y(d.Dim1) + 30; })
		.attr('width', function(d) { return x(d.Metric1); })
		.attr('height', y.rangeBand())
		.attr("fill", "none")
		.attr("class", "selectable")
		.attr("data-value",function(d) {return d.dimensionid})
		.style("stroke-width", 2)
		.style("stroke", leftColor);
	} else {
		leftBarGroup.selectAll('.bar.left')
		.data(data)
		.enter().append('rect')
		.attr('class', 'bar left')
		.attr('x', 0)
		.attr('y', function(d) { return y(d.Dim1) + 30; })
		.attr('width', function(d) { return x(d.Metric1); })
		.attr('height', y.rangeBand())
		.attr("fill", leftColor)
		.attr("class", "selectable")
		.attr("data-value",function(d) {return d.dimensionid})
		.style("stroke-width", 2)
		.style("stroke", "black");
	}

	if(hasD4){
		rightBarGroup.selectAll('.bar.right')
		.data(data)
		.enter().append('rect')
		.attr('class', 'bar right')
		.attr('x', 0)
		.attr('y', function(d) { return y(d.Dim1) + 30;})
		.attr('width', function(d) { return x(d.Metric2); })
		.attr('height', y.rangeBand())
		.attr("fill", "none")
		.attr("class", "selectable")
		.attr("data-value",function(d) {return d.dimensionid})
		.style("stroke-width", 2)
		.style("stroke", rightColor);
	} else {
		rightBarGroup.selectAll('.bar.right')
		.data(data)
		.enter().append('rect')
		.attr('class', 'bar right')
		.attr('x', 0)
		.attr('y', function(d) { return y(d.Dim1) + 30;})
		.attr('width', function(d) { return x(d.Metric2); })
		.attr('height', y.rangeBand())
		.attr("fill", rightColor)
		.attr("class", "selectable")
		.attr("data-value",function(d) {return d.dimensionid})
		.style("stroke-width", 2)
		.style("stroke", "black");
	}

	
	if(hasD3){
	leftBarGroup2.selectAll('.bar.left')
	.data(data)
	.enter().append('rect')
    .attr('class', 'bar left')
    .attr('x', 0)
    .attr('y', function(d) { return y(d.Dim1) + 30;  })
    .attr('width', function(d) { return x(d.Metric3); })
    .attr('height', y.rangeBand())
	.attr("fill", leftColor)
	.attr("fill-opacity", 0.3)
	.attr("class", "selectable")
	.attr("data-value",function(d) {return d.dimensionid})
	.style("stroke-width", 2)
	.style("stroke", leftColor)
	.style("stroke-opacity", 0.3);
    }

	if(hasD4) {
	rightBarGroup2.selectAll('.bar.right')
	.data(data)
	.enter().append('rect')
    .attr('class', 'bar right')
    .attr('x', 0)
    .attr('y', function(d) { return y(d.Dim1) + 30; })
    .attr('width', function(d) { return x(d.Metric4); })
    .attr('height', y.rangeBand() )
	.attr("fill", rightColor)
	.attr("fill-opacity", 0.3)
	.attr("class", "selectable")
	.attr("data-value",function(d) {return d.dimensionid})
	.style("stroke-width", 2)
	.style("stroke", rightColor)
	.style("stroke-opacity", 0.3);
	}

	
}

function objToString(obj) {
            var str = '';
            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    str += p + '->' + obj[p] + '<br/><br/>';
                }
            }
            return str;
        }
