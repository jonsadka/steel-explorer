var pWidth = pHeight = RIGHT_ROW_1_HEIGHT * 0.3;

var px = d3.scale.linear()
    .range([0, pWidth]);

var py = d3.scale.linear()
    .range([0, pHeight]);

function initializeProfileChart(){
  // pWidth =
  // pHeight =

  var maxBound = Math.max(SPECIAL.bf.boundMax, SPECIAL.d.boundMax);
  px.range([0, pWidth])
    .domain([0, maxBound]);
  py.range([0, pHeight])
    .domain([maxBound, 0]);
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
  var drawings = [];
  var rectangles = [
    {offsetX: 0, offsetY: 0, width: tw, height: d, stroke: 'none', fill: 'crimson'},
    {offsetX: 0, offsetY: (d - tf), width: bf, height: tf, stroke: 'none', fill: 'crimson'},
    {offsetX: 0, offsetY: -(d - tf), width: bf, height: tf, stroke: 'none', fill: 'crimson'},
  ];
  var tickHeight = Math.max(3, py(SPECIAL.d.boundMax - tf));
  var annotationTWeb = [
    {offsetX:  tw, offsetY: py(SPECIAL.d.boundMax - d + 4*tf), width: 1, height: pHeight/20, stroke: 'none', fill: 'blue', override: true},
    {offsetX: -tw, offsetY: py(SPECIAL.d.boundMax - d + 4*tf), width: 1, height: pHeight/20, stroke: 'none', fill: 'blue', override: true},
    {offsetX: -2*tw, offsetY: py(SPECIAL.d.boundMax - d + 4*tf) - pHeight/20, width: pWidth/6, height: 1, stroke: 'none', fill: 'blue', override: true},
  ]
  drawings = drawings.concat(rectangles).concat(annotationTWeb);
  mSvg.selectAll('.w-group.selected-beam.profile')
      .data(drawings)
    .enter().append('rect')
      .attr('class', function(d){ return 'w-group selected-beam profile ' + escapeCharacter(beam.AISC_Manual_Label); })
      .attr('x', function(d){
        if (d.override){ return (pWidth - d.width + px(d.offsetX)) / 2; }
        return (pWidth - px(d.width - d.offsetX)) / 2;
      })
      .attr('rx', 2)
      .attr('y', function(d){
        if (d.override){ return (pHeight - d.offsetY) / 2;}
        return (pHeight - py(SPECIAL.d.boundMax - d.height - d.offsetY)) / 2;
      })
      .attr('width', function(d){
        if (d.override){ return d.width; }
        return px(d.width);
      })
      .attr('height', function(d){
        if (d.override){ return d.height; }
        return py(SPECIAL.d.boundMax - d.height);
      })
      .attr('fill', function(d){
        if (d.fill) return d.fill;
        return 'none';
      })
      .attr('stroke', function(d){
        if (d.stroke) return d.stroke;
        return 'crimson';
      })
      .attr('pointer-events', 'none')
      .attr('stroke-width', 1)
}
