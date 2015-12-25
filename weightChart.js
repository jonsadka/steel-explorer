var wMargin = {top: 20, right: 20, bottom: 30, left: 40},
    wWidth = COL_1_WIDTH - wMargin.left - wMargin.right,
    wHeight = ROW_2_HEIGHT - wMargin.top - wMargin.bottom - 10;

var wSvg = d3.select('#bottom-left').append('svg')
    .attr('width', wWidth + wMargin.left + wMargin.right)
    .attr('height', wHeight + wMargin.top + wMargin.bottom)
  .append('g')
    .attr('transform', 'translate(' + wMargin.left + ',' + wMargin.top + ')');
