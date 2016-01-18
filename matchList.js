var MATCHES_SHOWN = 20;

function initializeMatchList(){
  var container = document.getElementById('middle-container'),
      table  = document.createElement('table');
  table.id = 'match-list-table'
  table.style.width  = '100px';
  table.style.border = '1px solid black';

  // Sort beams by those with highest unbraced length of 0
  var wBeamsList = Object.keys(W_BEAMS_MAP)
      .map(function(shape){ return W_BEAMS_MAP[shape]; })
      .sort(function(a, b){ return +b.MnValues[0].Mn - +a.MnValues[0].Mn; });
  // Get top 15 sorted by Weight
  wByWeight = wBeamsList.sort(function(a, b){ return +a.W - +b.W; }).slice(0, MATCHES_SHOWN);
  // Get top 15 sorted by Weight
  wByDepth = wBeamsList.sort(function(a, b){ return +a.d - +b.d; }).slice(0, MATCHES_SHOWN);

  var tr = table.insertRow();
  var td = tr.insertCell();
  td.appendChild(document.createTextNode('Weight'));
  var td = tr.insertCell();
  td.appendChild(document.createTextNode('Depth'));

  for(var i = 0; i < MATCHES_SHOWN; i++){
    var tr = table.insertRow();
    for(var j = 0; j < 2; j++){
      var td = tr.insertCell();
      // td.style.border = '1px solid black';
      if (j === 0){
        var beam = wByWeight[i];
        td.appendChild(document.createTextNode(beam.AISC_Manual_Label));
      } else if (j === 1){
        var beam = wByDepth[i];
        td.appendChild(document.createTextNode(beam.AISC_Manual_Label + '(' + beam.d + 'in)'));
      }
      // td.setAttribute('rowSpan', '2');
    }
  }
  container.appendChild(table);
}

function updateMatchList(){
  var table = document.getElementById('match-list-table');
  var rows = table.rows;
  var sortedBeams = getOptimalBeams(W_BEAMS_FILTERED)

  // Start at -1 becase we want to skip the header row
  for (var i = 0; i < rows.length; i++){
    if (i === 0) continue;
    var row = rows[i];
    for(var j = 0; j < row.cells.length; j++){
      var cell = row.cells[j];
      if (j === 0){
        var beam = sortedBeams.weight[i];
        if (beam){
          cell.innerHTML = beam.AISC_Manual_Label;
        } else {
          cell.innerHTML = '';
        }
      } else if (j === 1){
        var beam = sortedBeams.depth[i];
        if (beam){
          cell.innerHTML = beam.AISC_Manual_Label + '(' + beam.d + 'in)';
        } else {
          cell.innerHTML = '';
        }
      }
    }
  }
}

function getOptimalBeams(filteredBeams){
  // Sort beams by those with highest unbraced length of 0
  var wBeamsList = [].concat.apply([], filteredBeams.map(function(group){ return group.values; }))
      .sort(function(a, b){ return +b.MnValues[0].Mn - +a.MnValues[0].Mn; });
  // Add filler to array to take place of header
  wBeamsList.unshift('Header');
  return {
    weight: wBeamsList.sort(function(a, b){ return +a.W - +b.W; }).slice(0, MATCHES_SHOWN + 1),
    depth: wBeamsList.sort(function(a, b){ return +a.d - +b.d; }).slice(0, MATCHES_SHOWN + 1)
  }
}
