var DEFAULT_Fy = 50; // ksi
var DEFAULT_E = 29000; // ksi
var DEFAULT_Cb = 1; //
var MAX_UNBRACED = 81; // ft
var UNBRACED_STEP = 1; // ft

// User inputs
var START_LENGTH = null;
var USER_WEIGHT = null;

// HEIGHTS
var chartsHeight = window.innerHeight;
var ROW_1_HEIGHT = 0.6 * chartsHeight;
var ROW_2_HEIGHT = 0.4 * chartsHeight;

var W_BEAMS = [];
d3.csv('data.csv', function(error, data) {
  if (error) throw error;

  var beams = d3.nest()
    .key(function(d){ return d.AISC_Manual_Label.split('X')[0]; })
    .entries(data)

  W_BEAMS = beams.filter(getWSections);
  W_BEAMS.forEach(calculateProperties);

  initializeMomentChart();
});

function getWSections (data){
  return (data.key.slice(0,1) === 'W') && (data.key.slice(0,2) !== 'WT');
}

function filterBeams (d){
  if (USER_WEIGHT){
    if (+d.W <= USER_WEIGHT) return 0.4;
    return 0.07;
  }
  return 0.1;
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
    bm.MnValues = d3.range(0, MAX_UNBRACED, UNBRACED_STEP).map(function(length){
      return { length: length, Mn: bm.MnFunction(length)/12 }
    })


  })
}