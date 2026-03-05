// Old Jeb — grizzled moonshiner who lives for strong shine and loves the thrill.
// He ALWAYS wants you to push harder. Even when it's suicidal.

// Sprite images for each state
const FACES = {
  idle: 'assets/jeb/jeb_idle.png',
  tasting_low: 'assets/jeb/jeb_tasting_low.png',
  tasting_mid: 'assets/jeb/jeb_tasting_mid.png',
  tasting_high: 'assets/jeb/jeb_tasting_high.png',
  tasting_great: 'assets/jeb/jeb_tasting_great.png',
  worried: 'assets/jeb/jeb_worried.png',
  scared: 'assets/jeb/jeb_scared.png',
  blowout: 'assets/jeb/jeb_blowout.png',
};

const PHRASES = {
  idle: [
    "Git to brewin', ya lazy sumbitch!",
    "This still ain't gonna run itself!",
    "Quit scratchin' yer ass and draw somethin'!",
    "Well? I ain't got all damn day!",
    "Fire's lit, stash is loaded... BREW already!",
    "What're you waitin' for, an invitation from Jesus?",
    "I swear you're slower than molasses in January.",
    "My grandpappy would've brewed three batches by now.",
    "You gonna stand there like a fence post all day?",
    "The fire's burnin', the mash is waitin'... LET'S GO!",
    "I didn't haul all this corn up the mountain for nothin'!",
    "Hit the damn button 'fore I do it myself!",
  ],

  tasting_low: [
    "That ain't moonshine, that's damn water.",
    "My dead granny could brew better'n this.",
    "Weak as hell... keep goin' or go home.",
    "C'mon, put some goddamn BALLS into it!",
    "I've tasted stronger creek water.",
    "That wouldn't get a church mouse drunk.",
    "You call that shine? I call that a DISGRACE.",
    "Pathetic. My dog wouldn't drink that swill.",
    "Hell, rainwater's got more kick than this.",
    "Keep brewin'. You ain't proved shit yet.",
    "A baby could sip this and walk a straight line.",
    "This batch is embarrassin' both of us right now.",
    "Lord help me, I'm workin' with an amateur.",
    "That proof is lower than a snake's belly.",
  ],

  tasting_mid: [
    "Now we're gettin' somewhere...",
    "Not bad. Not good neither, but not bad.",
    "That'll get a man proper drunk at least.",
    "Keep pourin', it's gettin' interestin'...",
    "Startin' to taste like real shine now.",
    "I can feel a tingle. Don't stop now!",
    "Yeah... yeah, that's got some bite to it.",
    "We're on to somethin' here. KEEP GOIN'!",
    "Now that's worth a sip. But we can do BETTER.",
    "Decent. But decent don't win competitions.",
    "Gettin' warm. Don't you dare stop now.",
    "I've had worse. I've had a LOT better. MORE!",
    "That'd sell at market. But we ain't sellin' THAT.",
    "My interest is piqued. Don't disappoint me, boy.",
  ],

  tasting_high: [
    "Hoo-wee! That'll put hair on yer chest!",
    "Now THAT'S what I call goddamn MOONSHINE!",
    "Hot damn, that's some FINE rotgut!",
    "Lord almighty, I can feel my teeth sweat!",
    "Son of a bitch, that's BEAUTIFUL!",
    "ONE MORE! C'mon, push it! PUSH IT!",
    "Don't you DARE bottle now, we're just gettin' started!",
    "My eyes are waterin'! That's how you know it's GOOD!",
    "That shine could strip paint off a barn door!",
    "YEEHAW! Now THAT'S what I live for!",
    "Another draw! We can make this a LEGEND!",
    "I can feel it in my bones — this batch is SPECIAL!",
    "You stop now and I will NEVER forgive you!",
    "That proof is singin' to me! Keep it goin'!",
    "We ain't done 'til the devil himself asks for a sip!",
  ],

  tasting_great: [
    "HOLY SHIT! That's liquid goddamn GOLD!",
    "Best shine this side of the Blue Ridge!",
    "I'm cryin' actual tears... it's PERFECT.",
    "Sweet mercy, that'd make the devil himself weep!",
    "If I die right now, I die the happiest man alive!",
    "ONE MORE DRAW! Let's make HISTORY!",
    "This is the greatest batch I ever laid tongue on!",
    "My whole life has led to this moment right here!",
    "They'll sing SONGS about this moonshine!",
    "Keep goin'! We're brewin' a goddamn MASTERPIECE!",
    "I can see God and he's THIRSTY! Don't stop!",
    "That proof is so high the ANGELS can taste it!",
    "I'd sell my own mother for another draw right now!",
    "This is it! This is the one they'll remember!",
    "LEGENDARY! But it could be MYTHICAL! MORE!!!",
    "My hands are shakin' and it ain't from the cold!",
  ],

  worried: [
    "She's rattlin'... but that just means it's WORKIN'!",
    "Pressure's risin'... *grin* ...I love this part.",
    "Gettin' dangerous... HELL YEAH it is!",
    "I can hear her groanin'... but we ain't done yet!",
    "A little danger never hurt nobody! ...much. BREW!",
    "The still's angry but the SHINE is gorgeous!",
    "Risk is what separates legends from cowards! DRAW!",
    "Yeah she's hot... but so is this batch! Keep goin'!",
    "My hands are sweatin' and I LOVE it! Hit it again!",
    "We're dancin' on the edge! That's where the MAGIC is!",
    "The best shine comes from the most dangerous brews!",
    "Pressure means PROGRESS! Don't be a damn coward!",
    "I've seen worse! ...no I haven't. DRAW ANYWAY!",
    "She's whinin' but she'll hold! Probably! BREW!",
  ],

  scared: [
    "Oh SHIT oh shit... *manic grin* ...one more?",
    "We're either gonna make the best shine ever or DIE!",
    "I can smell the explosion... smells like GLORY!",
    "Lord have mercy... but DON'T YOU STOP!",
    "Every bone in my body says stop... but my HEART says BREW!",
    "If she blows, she blows! THAT'S HOW LEGENDS ARE MADE!",
    "I'm prayin' and brewin' at the same damn time!",
    "One more draw and we're either GODS or DEAD!",
    "My life is flashin' before my eyes... WORTH IT!",
    "The still sounds like a rattlesnake! I LOVE IT!",
    "If this is how I go, WHAT A WAY TO GO!",
    "I've cheated death before! ...haven't I? BREW!",
    "She's screamin'... but the shine is SCREAMIN' LOUDER!",
    "Ah hell, we've come THIS far! ONE MORE!",
    "I'm too old to die young! ...but let's RISK IT!",
  ],

  blowout: [
    "GODDAMMIT ALL TO HELL!!!",
    "Well ain't that a grade-A SONOFABITCH!",
    "There goes the whole goddamn batch!",
    "My still! MY BEAUTIFUL GODDAMN STILL!",
    "*cough* ...I think I'm bleedin'...",
    "That was the most GLORIOUS explosion I ever seen!",
    "Worth it. Every goddamn drop was WORTH IT!",
    "Ha! HAHAHAHA! We almost had it! ALMOST!",
    "The roof's on fire and I regret NOTHING!",
    "Well... at least we went out like MEN!",
    "I'll be pickin' copper outta my teeth for a WEEK!",
    "That blast rattled my ancestors' graves!",
    "SHE BLEW! ...but what a BEAUTIFUL run it was!",
    "I'm missin' an eyebrow but I'm SMILIN'!",
    "Clean it up, patch the still... we go AGAIN!",
  ],
};

function getState(player, threshold) {
  if (player.blownOut) return 'blowout';
  if (player.pot.length === 0) return 'idle';

  // Pressure states take priority
  if (player.whiteTotal >= threshold - 1) return 'scared';
  if (player.whiteTotal >= Math.ceil(threshold * 0.57)) return 'worried';

  // Proof position states
  if (player.position >= 25) return 'tasting_great';
  if (player.position >= 17) return 'tasting_high';
  if (player.position >= 9) return 'tasting_mid';
  return 'tasting_low';
}

export function updateBrewmaster(container, player, threshold) {
  const state = getState(player, threshold);
  const faceImg = FACES[state] || FACES.idle;
  const phrases = PHRASES[state] || PHRASES.idle;

  // Deterministic but varied phrase selection
  const phraseIdx = (player.pot.length * 17 + player.whiteTotal * 7 + player.position) % phrases.length;
  const phrase = phrases[phraseIdx];

  container.innerHTML = `
    <div class="brewmaster-portrait"><img src="${faceImg}" alt="Old Jeb"></div>
    <div class="brewmaster-speech">
      <div class="brewmaster-name">Old Jeb</div>
      <div class="brewmaster-quote">"${phrase}"</div>
    </div>
  `;

  container.className = `brewmaster brewmaster-${state}`;
}

/*
========================================
OLD JEB — CHARACTER SPEC FOR ASSET DESIGNER
========================================

WHO HE IS:
  Old Jeb is a grizzled, wild-eyed Appalachian moonshiner in his 60s-70s.
  He's been brewing illegal liquor in the mountains his whole life.
  He's an adrenaline junkie — he LOVES the danger of a still about to blow.
  He never tells you to stop. He always wants stronger shine, more risk.
  Think: if a feral raccoon became a human and learned to make whiskey.

PHYSICAL APPEARANCE:
  - Weathered, sun-beaten face with deep wrinkles and a permanent squint
  - Wild, unkempt grey beard (long, scraggly, bits of debris in it)
  - Missing teeth (2-3 gaps visible when grinning)
  - Bushy eyebrows that are very expressive
  - Beat-up wide-brim hat or coonskin cap (optional, adds silhouette)
  - Dirty overalls or flannel shirt, one strap hanging
  - Lean/wiry build — tough as jerky
  - Ruddy nose (he samples his own product... a lot)

EXPRESSIONS NEEDED (8 states):

  1. IDLE — Impatient, arms crossed or tapping foot
     Bored, annoyed, waiting. Slight scowl. Foot tapping.
     "Hurry up and brew" energy.

  2. TASTING_LOW — Disgusted, spitting
     Scrunched nose, tongue out, maybe spitting to the side.
     Unimpressed. "This tastes like creek water" face.

  3. TASTING_MID — Mildly interested, one eyebrow raised
     Chin-stroking, contemplative. Not impressed but not angry.
     "Okay, I'm listening" energy. Slight smirk.

  4. TASTING_HIGH — Excited, wide grin
     Big toothy grin (missing teeth showing), eyes wide.
     Holding up a jar admiringly. Practically vibrating.
     "Now THAT'S moonshine!" energy.

  5. TASTING_GREAT — Ecstatic, tears of joy
     Head thrown back in rapture. Tears streaming. Hugging a jar.
     Wild manic grin. This is the peak of his existence.
     "I've seen the face of God and he's THIRSTY" energy.

  6. WORRIED — Nervous but grinning, sweating
     Sweat drops, wide eyes, but with a GRIN. He's scared but loving it.
     One hand on hat, leaning back slightly. Thrill-seeker energy.
     NOT telling you to stop — encouraging with fear in his eyes.

  7. SCARED — Terrified but manic, eyes bulging
     Hair/beard standing on end. Eyes huge. Manic smile.
     Gripping his hat. One foot stepping back. But STILL GRINNING.
     "We might die and I'm INTO IT" energy.

  8. BLOWOUT — Explosion aftermath, singed but alive
     Blackened face, hat blown off or on fire, beard smoking.
     Could be laughing through the wreckage OR furious.
     Mix of "GODDAMMIT" and "...that was AWESOME."

FORMAT / TECHNICAL:
  - Bust/portrait format (head + shoulders), roughly square aspect ratio
  - Pixel art style matching the game aesthetic (16-32px base, scaled up)
  - OR hand-drawn style with thick outlines (whichever fits the game better)
  - Transparent background
  - Each expression as a separate PNG file
  - Naming: jeb_idle.png, jeb_tasting_low.png, jeb_tasting_mid.png,
    jeb_tasting_high.png, jeb_tasting_great.png, jeb_worried.png,
    jeb_scared.png, jeb_blowout.png
  - Place in /assets/brewmaster/
  - Size suggestion: 64x64 or 96x96 pixels (will be displayed at ~48-64px)

COLOR PALETTE (to match game):
  - Skin: warm tan/ruddy (#c4956a → #8a5534)
  - Beard: grey-white (#b8b0a0 → #787068)
  - Hat/clothes: browns matching copper theme (#5a3d28, #3e2a1a)
  - Background: transparent
  - Accent: copper highlights (#b87333)

ONCE ASSETS EXIST:
  Replace the FACES object keys with <img> tags pointing to the PNGs,
  or swap the .brewmaster-portrait content via CSS background-image per state.
========================================
*/
