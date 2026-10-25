export type RoadCondition = 'dry' | 'wet' | 'snow' | 'ice';

export type StoppingConfig = {
  gravity: number;
  speed: number; // m/s, speed at the moment of noticing a hazard
  reactionTime: number; // s
  friction: number; // coefficient of kinetic friction between tyre and road
};

export type StoppingState = {
  t: number; // s, elapsed since noticing the hazard
  distance: number; // m, travelled so far
  speed: number; // m/s, current speed
  phase: 'reacting' | 'braking' | 'stopped';
};

export type StoppingScenario = 'alert-dry' | 'distracted-dry' | 'alert-wet' | 'alert-ice';
