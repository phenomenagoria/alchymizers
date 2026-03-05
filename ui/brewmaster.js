// Old Jeb — the brewmaster character who reacts to your brewing

const FACES = {
  idle: '🧔',
  tasting_low: '😐',
  tasting_mid: '😏',
  tasting_high: '😁',
  tasting_great: '🤩',
  worried: '😰',
  scared: '😱',
  blowout: '🤬',
};

const PHRASES = {
  idle: [
    "Git to brewin', ya lazy sumbitch!",
    "This still ain't gonna run itself!",
    "Quit scratchin' yer ass and draw somethin'!",
    "Well? I ain't got all damn day!",
    "Fire's lit, stash is loaded... BREW already!",
  ],
  tasting_low: [
    "That ain't moonshine, that's damn water.",
    "My dead granny could brew better'n this.",
    "Weak as hell... keep goin' or go home.",
    "C'mon, put some goddamn BALLS into it!",
    "I've tasted stronger creek water.",
  ],
  tasting_mid: [
    "Now we're gettin' somewhere...",
    "Not bad. Not good neither, but not bad.",
    "That'll get a man proper drunk at least.",
    "Keep pourin', it's gettin' interestin'...",
    "Startin' to taste like real shine now.",
  ],
  tasting_high: [
    "Hoo-wee! That'll put hair on yer chest!",
    "Now THAT'S what I call goddamn moonshine!",
    "Hot damn, that's some FINE rotgut!",
    "Lord almighty, I can feel my teeth sweat!",
    "Son of a... that's BEAUTIFUL shine right there!",
  ],
  tasting_great: [
    "HOLY SHIT! That's liquid goddamn gold!",
    "Best 'shine this side of the Blue Ridge!",
    "I'm cryin' actual tears right now... it's perfect.",
    "Sweet mercy, that'd make the devil himself weep!",
    "If I die right now, I die a happy man!",
  ],
  worried: [
    "Easy now... she's startin' to rattle somethin' fierce.",
    "I'm gettin' a real bad feelin' 'bout this...",
    "Pressure's risin'... maybe cork it up, yeah?",
    "Watch it! I can hear the old bitch groanin'...",
    "Don't be a damn fool... she's ready to blow!",
  ],
  scared: [
    "SHIT SHIT SHIT! One more and we're DEAD!",
    "Lord have mercy on our sorry asses!",
    "I can SMELL the explosion comin'!",
    "For the love of GOD, STOP BREWIN'!",
    "Sweet Jesus... I ain't ready to die today!",
  ],
  blowout: [
    "GODDAMMIT ALL TO HELL!!!",
    "Well ain't that a grade-A SONOFABITCH!",
    "There goes the whole goddamn batch!",
    "My still! MY BEAUTIFUL GODDAMN STILL!",
    "MOTHER OF... *cough*... I think I'm bleedin'...",
  ],
};

function getState(player, threshold) {
  if (player.blownOut) return 'blowout';
  if (player.pot.length === 0) return 'idle';

  // Pressure takes priority for worried/scared
  if (player.whiteTotal >= threshold - 1) return 'scared';
  if (player.whiteTotal >= Math.ceil(threshold * 0.57)) return 'worried';

  // Otherwise go by proof position
  if (player.position >= 25) return 'tasting_great';
  if (player.position >= 17) return 'tasting_high';
  if (player.position >= 9) return 'tasting_mid';
  return 'tasting_low';
}

export function updateBrewmaster(container, player, threshold) {
  const state = getState(player, threshold);
  const face = FACES[state] || '🧔';
  const phrases = PHRASES[state] || PHRASES.idle;
  const phrase = phrases[player.pot.length % phrases.length];

  container.innerHTML = `
    <div class="brewmaster-portrait">${face}</div>
    <div class="brewmaster-speech">
      <div class="brewmaster-name">Old Jeb</div>
      <div class="brewmaster-quote">"${phrase}"</div>
    </div>
  `;

  container.className = `brewmaster brewmaster-${state}`;
}
