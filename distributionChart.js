var dMargin = {top: 20, right: 20, bottom: 20, left: 30},
    dWidth = LEFT_CHARTS_WIDTH - dMargin.left - dMargin.right,
    dHeight = LEFT_ROW_3_HEIGHT - dMargin.top - dMargin.bottom - 10;

var dx0 = d3.scale.linear()
    .range([0, dWidth], .1);

var dy0 = d3.scale.linear()
    .range([0, dHeight]);

var dXAxis = d3.svg.axis()
    .scale(dx0)
    .orient('bottom');

var dYAxis = d3.svg.axis()
    .scale(dy0)
    .orient('left');

var dSvg = d3.select('#bottom-container').append('svg')
    .attr('width', dWidth + dMargin.left + dMargin.right)
    .attr('height', dHeight + dMargin.top + dMargin.bottom)
  .append('g')
    .attr('transform', 'translate(' + dMargin.left + ',' + dMargin.top + ')');

function initializeDistributionChart(){
}
