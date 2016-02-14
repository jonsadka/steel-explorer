var pWidth = pHeight = RIGHT_ROW_1_HEIGHT * 0.3;

var px = d3.scale.linear()
var py = d3.scale.linear()

function initializeProfileChart(){
  // pWidth =
  // pHeight =

  var maxBound = Math.max(SPECIAL.bf.boundMax, SPECIAL.d.boundMax);
  px.range([0, pWidth])
    .domain([0, maxBound]);
  py.range([0, pHeight])
    .domain([maxBound, 0]);

  // FOR debugging
  mSvg.append('rect').attr({
    x: 0,
    y: 0,
    height: py(0),
    width: px(maxBound),
    "stroke-width": 1,
    stroke: 'RGBA(77, 55, 75, 0.5)',
    fill: 'none',
    'transform': 'translate(' + (mWidth - mMargin.left - pWidth) + ',' + BEAM_SIZE_FONT_SIZE + ')'
  })
}

function removeBeamProfile(d){
  mSvg.selectAll('.w-group.selected-beam.profile').remove();
}

function showBeamProfile(d){
  var beam = W_BEAMS_MAP[d.AISC_Manual_Label];
  var tf = +beam.tf;
  var tw = +beam.tw;
  var bf = +beam.bf;
  var d = +beam.d;

  var rectangles = [
    {offsetX: 0, offsetY: 0, width: tw, height: d, stroke: 'none', fill: 'crimson'},
    {offsetX: 0, offsetY: (d - tf), width: bf, height: tf, stroke: 'none', fill: 'crimson'},
    {offsetX: 0, offsetY: -(d - tf), width: bf, height: tf, stroke: 'none', fill: 'crimson'},
  ];

  mSvg.selectAll('.w-group.selected-beam.profile')
      .data(rectangles)
    .enter().append('rect')
      .attr('transform', 'translate(' + (mWidth - mMargin.left - pWidth) + ',' + BEAM_SIZE_FONT_SIZE + ')')
      .attr('class', function(d){ return 'w-group selected-beam profile ' + escapeCharacter(beam.AISC_Manual_Label); })
      .attr('x', function(d){
        return (pWidth - px(d.width - d.offsetX)) / 2;
      })
      .attr('rx', 2)
      .attr('y', function(d){
        return (pHeight - py(SPECIAL.d.boundMax - d.height - d.offsetY)) / 2;
      })
      .attr('width', function(d){
        return px(d.width);
      })
      .attr('height', function(d){
        return py(SPECIAL.d.boundMax - d.height);
      })
      .attr('fill', function(d){
        return d.fill || 'none';
      })
      .attr('stroke', function(d){
        return d.stroke || 'crimson';
      })
      .attr('pointer-events', 'none')
      .attr('stroke-width', 1)
}

// function showBeamProfile(d){
//   var beam = W_BEAMS_MAP[d.AISC_Manual_Label];
//   var tf = +beam.tf;
//   var tw = +beam.tw;
//   var bf = +beam.bf;
//   var d = +beam.d;
//   var rectangles = [
//     {offsetX: 0, offsetY: 0, width: tw, height: d, stroke: 'none', fill: 'crimson'},
//     {offsetX: 0, offsetY: (d - tf), width: bf, height: tf, stroke: 'none', fill: 'crimson'},
//     {offsetX: 0, offsetY: -(d - tf), width: bf, height: tf, stroke: 'none', fill: 'crimson'},
//   ];
//   var tickHeight = Math.max(3, py(SPECIAL.d.boundMax - tf));
//   var annotationTWeb = [
//     {offsetX:  tw, offsetY: py(SPECIAL.d.boundMax - d + 4*tf), width: 1, height: pHeight/20, stroke: 'none', fill: 'blue', override: true},
//     {offsetX: -tw, offsetY: py(SPECIAL.d.boundMax - d + 4*tf), width: 1, height: pHeight/20, stroke: 'none', fill: 'blue', override: true},
//     {offsetX: -2*tw, offsetY: py(SPECIAL.d.boundMax - d + 4*tf) - pHeight/20, width: pWidth/6, height: 1, stroke: 'none', fill: 'blue', override: true},
//   ]
//   var drawings = rectangles.concat(annotationTWeb);
//   mSvg.selectAll('.w-group.selected-beam.profile')
//       .data(drawings)
//     .enter().append('rect')
//       .attr('transform', 'translate(' + (mWidth - mMargin.left - pWidth) + ',' + BEAM_SIZE_FONT_SIZE + ')')
//       .attr('class', function(d){ return 'w-group selected-beam profile ' + escapeCharacter(beam.AISC_Manual_Label); })
//       .attr('x', function(d){
//         if (d.override){ return (pWidth - d.width + px(d.offsetX)) / 2; }
//         return (pWidth - px(d.width - d.offsetX)) / 2;
//       })
//       .attr('rx', 2)
//       .attr('y', function(d){
//         if (d.override){ return (pHeight - d.offsetY) / 2;}
//         return (pHeight - py(SPECIAL.d.boundMax - d.height - d.offsetY)) / 2;
//       })
//       .attr('width', function(d){
//         if (d.override){ return d.width; }
//         return px(d.width);
//       })
//       .attr('height', function(d){
//         if (d.override){ return d.height; }
//         return py(SPECIAL.d.boundMax - d.height);
//       })
//       .attr('fill', function(d){
//         return d.fill || 'none';
//       })
//       .attr('stroke', function(d){
//         return d.stroke || 'crimson';
//       })
//       .attr('pointer-events', 'none')
//       .attr('stroke-width', 1)
// }
