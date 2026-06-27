export const SERVICE_TYPES = ['PD', 'FS', 'MVAC', 'EL', 'Bonding'];

export const DEFECT_CATEGORIES = {
  PD: [
    'External Wall openings seal up improper pipes',
    'Wall openings sealing up improper/ poor workmanship',
    'Incomplete Installation work',
    'Access panel cannot reach valves/water heater',
    'Water pipes and drainage pipe routing incorrect',
    'Pipework improper fixed /insufficient pipe bracket',
    'Hydraulic test of water pipes fail',
  ],
  FS: [
    'Pressure test for FS pipe fail',
    'Sprinkler head setting out/ location incorrect',
    'Smoke detector setting out/ location incorrect',
    'FS pipes routing incorrect',
    'FS pipe improper fixed/insufficient pipe bracket',
    'Wall openings sealing up improper/ poor workmanship',
  ],
  EL: [
    'Ceiling junction boxes location/ setting out incorrect',
    'Ceiling junction boxes cover improper/ missing',
    'Access panel cannot access the electrical equipment',
    'Ceiling junction boxes without marking',
    'Bonding for false ceiling frame incomplete/ missing',
  ],
  Bonding: [
    'Window bonding test fail',
    'Louvre bonding test fail',
    'French door bonding test fail',
    'Balcony / Up railing bonding test fail',
  ],
  MVAC: [
    'External Wall openings seal up improper',
    'Pressure test for refrigerant pipe fail',
    'Vacuum test for refrigerant pipe fail',
    'Drain test for CDP fail',
    'Air duct routing incorrect',
    'Refrigerant and CDP routing incorrect',
    'Air duct / pipe improper fixed/ insufficient support',
    'Wall openings sealing up improper/ poor workmanship',
    'Incomplete Installation work',
  ],
};

export const SERVICE_TYPE_NAMES = {
  PD: 'Plumbing & Drainage',
  FS: 'Fire Services',
  MVAC: 'MVAC',
  EL: 'Electrical',
  Bonding: 'Bonding',
};
