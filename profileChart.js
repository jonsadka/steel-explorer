var pMargin = {top: 20, right: 20, bottom: 30, left: 50},
    pWidth = LEFT_CHARTS_WIDTH - pMargin.left - pMargin.right,
    pHeight = LEFT_ROW_2_HEIGHT - pMargin.top - pMargin.bottom - 10;

var px0 = d3.scale.linear()
    .range([0, pWidth], .1);

var py0 = d3.scale.linear()
    .range([pHeight, 0]);

var pSvg = d3.select('#bottom-container').append('svg')
    .attr('width', pWidth + pMargin.left + pMargin.right)
    .attr('height', pHeight + pMargin.top + pMargin.bottom)
  .append('g')
    .attr('transform', 'translate(' + pMargin.left + ',' + pMargin.top + ')');

function initializeProfileChart(){
  mx0.domain([0, MAX_UNBRACED]);
  my0.domain([SPECIAL.yBoundMin * PHI, SPECIAL.yBoundMax * PHI]);


}
