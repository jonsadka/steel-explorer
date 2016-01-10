var DEFAULT_Fy = 50; // ksi
var DEFAULT_E = 29000; // ksi
var DEFAULT_Cb = 1; //
var MAX_UNBRACED = 51; // ft
var UNBRACED_STEP = 1; // ft

// User inputs
var START_LENGTH = null;
var USER_WEIGHT_MAX = null;
var USER_WEIGHT_MIN = null;
var USER_I_MAX = null;
var USER_I_MIN = null;

// HEIGHTS
var CHARTS_HEIGHT = window.innerHeight - document.getElementById('nav-bar').offsetHeight;
var LEFT_ROW_2_HEIGHT = 0.30 * CHARTS_HEIGHT;
var LEFT_ROW_3_HEIGHT = 0.30 * CHARTS_HEIGHT;
var RIGHT_ROW_1_HEIGHT = 0.55 * CHARTS_HEIGHT;
var RIGHT_ROW_2_HEIGHT = 0.45 * CHARTS_HEIGHT;
// WIDTHS
var LEFT_CHARTS_WIDTH = document.getElementById('left-column').offsetWidth;
var RIGHT_CHARTS_WIDTH = document.getElementById('right-column').offsetWidth;
var RIGHT_COL_1_WIDTH = RIGHT_CHARTS_WIDTH * 0.4;
var RIGHT_COL_2_WIDTH = RIGHT_CHARTS_WIDTH * 0.6;

// CACHED GLOBAL PROPERTIES
var W_BEAMS = [];
var W_BEAMS_MAP = {};
var W_BEAMS_FILTERED = [];
var SPECIAL = null;
var PHI = 0.9;

// HACK
setTimeout(function(){
  d3.csv('data.csv', function(error, data) {
    if (error) throw error;

    W_BEAMS_MAP = data.reduce(function(map, cv){
      if (cv.Type === 'W') map[cv.AISC_Manual_Label] = cv
      return map
    }, {})

    var beams = d3.nest()
      .key(function(d){ return d.AISC_Manual_Label.split('X')[0]; })
      .entries(data)

    W_BEAMS = beams.filter(isWSection);
    W_BEAMS.forEach(calculateProperties);
    SPECIAL = calculateSpecialProperties(W_BEAMS, {});

    initializeProfileChart();
    initializeDistributionChart();
    initializeIChart();
    initializeMomentChart();
  });
}, 10);

function isWSection (data){
  return (data.key.slice(0,1) === 'W') && (data.key.slice(0,2) !== 'WT');
}

function calculateProperties (beamGroup){
  beamGroup.values.forEach(function(bm){
    bm.Mp = DEFAULT_Fy * +bm.Zx; // kip-in
    bm.Lp = 1.76 * +bm.ry * Math.sqrt(DEFAULT_E / DEFAULT_Fy) / 12; // ft. [AISC 16.1-48 (F2-5)]
    var c = 1;                                                 // [AISC 16.1-48 (F2-8a)]
    bm.Lr = 1.95 * +bm.rts * (DEFAULT_E / (0.7 * DEFAULT_Fy))  // ft. [AISC 16.1-48 (F2-6)]
                  * Math.sqrt(+bm.J * c / (+bm.Sx * +bm.ho))
                  * Math.sqrt(1 + Math.sqrt(1 + 6.76 * Math.pow(
                    0.7 * DEFAULT_Fy * +bm.Sx * +bm.ho / (DEFAULT_E * +bm.J * c)
                  , 2))) / 12;
    // Returns Mn
    // Lb expected in feet
    bm.MnFunction = function(Lb){
      if (Lb <= bm.Lp){
        return bm.Mp;
      } else if (bm.Lp < Lb && Lb <= bm.Lr){
        return Math.min(bm.Mp,
          DEFAULT_Cb * (bm.Mp - (bm.Mp - 0.7 * DEFAULT_Fy * +bm.Sx) * (Lb - bm.Lp)/(bm.Lr - bm.Lp))
        );
      } else {
      var Fcr = (DEFAULT_Cb * Math.pow(Math.PI, 2) * DEFAULT_E / Math.pow(Lb*12/+bm.rts, 2)) // kip-in. [AISC 16.1-47 (F2-4)]
                * Math.sqrt(1 + 0.078 * +bm.J * c / (+bm.Sx * +bm.ho) * Math.pow(Lb*12/+bm.rts, 2));
        return Math.min(bm.Mp, Fcr * +bm.Sx);
      }
    }
    // Future optimization: Skip over every other point if you are in the straight line case (i.e. case 1)
    bm.MnValues = d3.range(0, MAX_UNBRACED, UNBRACED_STEP).map(function(length){
      return { length: length, Mn: bm.MnFunction(length)/12 }
    })
  })
}

function validateBeam (d, options){
  var passedValid = false;
  if (USER_WEIGHT_MIN || USER_WEIGHT_MAX){
    if (USER_WEIGHT_MIN && +d.W < USER_WEIGHT_MIN) return options.invalid;
    if (USER_WEIGHT_MAX && +d.W > USER_WEIGHT_MAX) return options.invalid;
    passedValid = true;
  }
  // if (USER_I_MAX || USER_I_MIN){
  //   if (USER_I_MAX && +d.Ix > USER_I_MAX) return options.invalid;
  //   if (USER_I_MIN && +d.Ix < USER_I_MIN) return options.invalid;
  //   passedValid = true;
  // }
  if (passedValid) return options.valid;
  return options.nullState;
}

function updateLength() {
  userLength = +document.getElementById('length-input').value;
  if (START_LENGTH === (userLength - 2)) return;
  START_LENGTH = Math.max(0, userLength - 2);
  endLength = (userLength === 0) ? MAX_UNBRACED : Math.min(MAX_UNBRACED, userLength + 2);

  SPECIAL = calculateSpecialProperties(W_BEAMS, {});

  mUpdateLength();
}

function updateWeight() {
  var NEW_USER_WEIGHT_MIN = +document.getElementById('weight-min-input').value;
  var NEW_USER_WEIGHT_MAX = +document.getElementById('weight-max-input').value;
  if (USER_WEIGHT_MAX === NEW_USER_WEIGHT_MAX && USER_WEIGHT_MIN === NEW_USER_WEIGHT_MIN) return;
  USER_WEIGHT_MIN = NEW_USER_WEIGHT_MIN;
  USER_WEIGHT_MAX = NEW_USER_WEIGHT_MAX;
  SPECIAL = calculateSpecialProperties(W_BEAMS, {});

  filterBeams();
  pUpdateWeight();
  mUpdateWeight();
  iUpdateWeight();
}

function updateI() {
  var NEW_USER_I_MIN = +document.getElementById('I-min-input').value;
  var NEW_USER_I_MAX = +document.getElementById('I-max-input').value;
  if (USER_I_MAX === NEW_USER_I_MAX && USER_I_MIN === NEW_USER_I_MIN) return;
  USER_I_MIN = NEW_USER_I_MIN;
  USER_I_MAX = NEW_USER_I_MAX;
  SPECIAL = calculateSpecialProperties(W_BEAMS, {});

  filterBeams();
  iUpdateI();
}

function calculateSpecialProperties(beams, options){
  var startLength = START_LENGTH || 0;
  var endLength = 61;
  var maxWeight = !!USER_WEIGHT_MAX ? Math.max(9, USER_WEIGHT_MAX) : Infinity;
  var minWeight = !!USER_WEIGHT_MIN ? Math.min(900, USER_WEIGHT_MIN) : 0;
  var maxI = !!USER_I_MAX ? Math.max(10, USER_I_MAX) : Infinity;
  var minI = !!USER_I_MIN ? Math.min(70000, USER_I_MIN) : 0;

  var groupDimensions = {}
  var special = beams.slice().reduce(function(pv, cv){
    var wGroup = cv.key;
    var groupStats = cv.values.reduce(function(pv, cv){
      var shouldUpdateMn = false;
      var shouldUpdateW = false;
      var shouldUpdateI = false;
      var shouldUpdateIxPerW = false;
      var shouldUpdateDimensions = false;
      if (minWeight <= +cv.W && +cv.W <= maxWeight){
        if (minI <= +cv.Ix && +cv.Ix <= maxI){
          shouldUpdateMn = true;
          shouldUpdateW = true;
          shouldUpdateI = true;
          shouldUpdateIxPerW = true;
          shouldUpdateDimensions = true;
        }
      }

      if (shouldUpdateMn){
        pv.Mn.Min = Math.min(pv.Mn.Min, cv.MnFunction(endLength));
        pv.Mn.Max = Math.max(pv.Mn.Max, cv.MnFunction(startLength));
      }
      if (shouldUpdateW){
        pv.W.Min = Math.min(pv.W.Min, +cv.W);
        pv.W.Max = Math.max(pv.W.Max, +cv.W);
      }
      if (shouldUpdateI){
        pv.I.Min = Math.min(pv.I.Min, +cv.Ix);
        pv.I.Max = Math.max(pv.I.Max, +cv.Ix);
      }
      if (shouldUpdateIxPerW){
        pv.IxPerW.Min = Math.min(pv.IxPerW.Min, +cv.Ix / +cv.W);
        pv.IxPerW.Max = Math.max(pv.IxPerW.Max, +cv.Ix / +cv.W);
      }
      if (shouldUpdateDimensions){
        pv.d.Min = Math.min(pv.d.Min, +cv.d);
        pv.d.Max = Math.max(pv.d.Max, +cv.d);
        pv.bf.Min = Math.min(pv.bf.Min, +cv.bf);
        pv.bf.Max = Math.max(pv.bf.Max, +cv.bf);
      }

      return pv
    }, {
      Mn: {Min: Infinity, Max: 0},
      W: {Min: Infinity, Max: 0},
      I: {Min: Infinity, Max: 0},
      IxPerW: {Min: Infinity, Max: 0},
      d: {Min: Infinity, Max: 0},
      bf: {Min: Infinity, Max: 0}
    });

    // Set the min and max properties thus far
    var specialProperties = ['Mn', 'W', 'I', 'IxPerW', 'd', 'bf'];
    for (var i = 0; i < specialProperties.length; i++){
      var variable = specialProperties[i];
      pv[variable].Min = Math.min(pv[variable].Min, groupStats[variable].Min);
      pv[variable].Max = Math.max(pv[variable].Max, groupStats[variable].Max);
    }
    // Cache the W group min and max dimensions
    groupDimensions[wGroup] = groupDimensions[wGroup] || {};
    var specialDimensions = ['d', 'bf'];
    for (var i = 0; i < specialDimensions.length; i++){
      var dimension = specialDimensions[i];
      groupDimensions[wGroup][dimension] = groupDimensions[wGroup][dimension] || {};
      if (groupStats[dimension].Max > 0) {
        groupDimensions[wGroup][dimension].Max = groupStats[dimension].Max;
      }
      if (groupStats[dimension].Min < Infinity){
        groupDimensions[wGroup][dimension].Min = groupStats[dimension].Min;
      }
      // Delete the dimension if no dimensions were set
      if (!Object.keys(groupDimensions[wGroup][dimension]).length) delete groupDimensions[wGroup][dimension];
    }
    // Delete the W group if no dimensions were set
    if (!Object.keys(groupDimensions[wGroup]).length) delete groupDimensions[wGroup];

    return pv;
  }, {
    Mn: {Min: Infinity, Max: 0},
    W: {Min: Infinity, Max: 0},
    I: {Min: Infinity, Max: 0},
    IxPerW: {Min: Infinity, Max: 0},
    d: {Min: Infinity, Max: 0},
    bf: {Min: Infinity, Max: 0}
  });

  special.groupDimensions = Object.keys(groupDimensions).map(function(wGroup){
    groupDimensions[wGroup].key = wGroup;
    return groupDimensions[wGroup];
  });;
  // convert from k-in to k-ft
  special.Mn.Min = special.Mn.Min / 12;
  special.Mn.Max = special.Mn.Max / 12;
  //Add padding to x and y axis
  special.Mn.boundMin = Math.floor(special.Mn.Min - special.Mn.Min * 0.01);
  special.Mn.boundMax = Math.ceil(special.Mn.Max + special.Mn.Max * 0.01);
  special.I.boundMin = Math.floor(special.I.Min - special.I.Min * 0.01);
  special.I.boundMax = Math.ceil(special.I.Max + special.I.Max * 0.01);
  special.d.boundMin = Math.floor(special.d.Min - special.d.Min * 0.05);
  special.d.boundMax = Math.ceil(special.d.Max + special.d.Max * 0.05);
  special.bf.boundMin = Math.floor(special.bf.Min - special.bf.Min * 0.05);
  special.bf.boundMax = Math.ceil(special.bf.Max + special.bf.Max * 0.05);
  return special;
}

function filterBeams(){
  W_BEAMS_FILTERED = W_BEAMS.map(function(group){
    var groupValues = [];
    for (var i = 0; i < group.values.length; i++){
      var beam = group.values[i];
      if (validateBeam(beam, {valid: true, invalid: false, nullState: true})) groupValues.push(beam);
    }
    return {key: group.key, values: groupValues};
  })
  .filter(function(group){
    return group.values.length
  })
}

d3.selectAll('input').on('change', updateDesignType);

function updateDesignType() {
  var designType = this.value;
  if (designType === 'LRFD'){
    PHI = 0.9;
  } else if (designType === 'ASD'){
    PHI = 999999;
  }
}

function escapeCharacter(string){
  return string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
}
