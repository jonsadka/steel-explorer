var iMargin = {top: 20, right: 20, bottom: 30, left: 40},
    iWidth = COL_1_WIDTH - iMargin.left - iMargin.right,
    iHeight = ROW_2_HEIGHT - iMargin.top - iMargin.bottom - 10;

var ix0 = d3.scale.ordinal()
    .range([0, iWidth], .1);

var iy0 = d3.scale.linear()
    .range([iHeight, 0]);

var iXAxis = d3.svg.axis()
    .scale(ix0)
    .orient('bottom');

var iYAxis = d3.svg.axis()
    .scale(iy0)
    .orient('left');

var iSvg = d3.select('#bottom-left').append('svg')
    .attr('width', iWidth + iMargin.left + iMargin.right)
    .attr('height', iHeight + iMargin.top + iMargin.bottom)
  .append('g')
    .attr('transform', 'translate(' + iMargin.left + ',' + iMargin.top + ')');

function initializeIChart(){
  ix0.domain(W_BEAMS.map(function(d){ return d.key}));
  iy0.domain([SPECIAL.iBoundMin, SPECIAL.iBoundMax]);

  iSvg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + iHeight + ')')
      .call(iXAxis);

  iSvg.append('g')
      .attr('class', 'y axis')
      .call(iYAxis)
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Ix (in^4)');


}

function iUpdateI(){
  console.log(SPECIAL)
}
