const samples = {
  Hindi: {
    cafe: ['एक चाय दीजिए, कृपया।', 'Ek chai deejiye, kripya.', 'One tea, please.', '“Deejiye” is a polite way to ask for something.'],
    directions: ['मेट्रो स्टेशन कहाँ है?', 'Metro station kahaan hai?', 'Where is the metro station?', 'Start with “Suniye” (excuse me) to politely get someone’s attention.'],
    shopping: ['यह कितने का है?', 'Yeh kitne ka hai?', 'How much is this?', 'Point to the item while you ask, so it’s clear which one you mean.']
  },
  Tamil: {
    cafe: ['ஒரு தேநீர் கொடுங்கள், தயவுசெய்து.', 'Oru theneer kodungal, thayavuseythu.', 'One tea, please.', '“Kodungal” is a respectful way to say “please give.”'],
    directions: ['மெட்ரோ நிலையம் எங்கே இருக்கிறது?', 'Metro nilaiyam enge irukkirathu?', 'Where is the metro station?', '“Enge” means “where.” You’ll hear it often when asking for directions.'],
    shopping: ['இது என்ன விலை?', 'Idhu enna vilai?', 'What is the price of this?', '“Vilai” means “price.” Point to the item you’re asking about.']
  },
  Bengali: {
    cafe: ['এক কাপ চা দিন, দয়া করে।', 'Ek kap cha din, doya kore.', 'One cup of tea, please.', '“Doya kore” means “please,” and “din” is a polite way to ask.'],
    directions: ['মেট্রো স্টেশন কোথায়?', 'Metro station kothay?', 'Where is the metro station?', '“Kothay” means “where.” Start with “Shunben?” to get someone’s attention.'],
    shopping: ['এটার দাম কত?', 'Etar dam koto?', 'How much does this cost?', '“Dam” means “price.” This question works for most items at a market.']
  }
};
const $ = id => document.getElementById(id);
const names = {cafe:'AT A CAFÉ', directions:'FINDING MY WAY', shopping:'AT THE MARKET'};
const lang = {Hindi:'hi',Tamil:'ta',Bengali:'bn'};
let busy = false;
let current;
function render(data, language, situation, live) {
  current = {...data, language, situation, live};
  for (const key of ['phrase','pronunciation','meaning','tip']) $(key).textContent = data[key];
  $('phrase').lang = lang[language];
  $('card-label').textContent = `${language.toUpperCase()} / ${names[situation]}`;
  $('source').textContent = live ? 'SARVAM GENERATED' : 'SAMPLE PHRASE';
  $('copy').textContent = 'Copy phrase ⧉';
  updateSaveButton();
}
function status(message, error = false) { $('status').textContent = message; $('status').classList.toggle('error', error); }
$('live').addEventListener('change', () => {
  $('context').disabled = !$('live').checked;
  $('mode-help').textContent = $('live').checked ? 'On · generates with your Sarvam account' : 'Off · explore built-in sample phrases';
  status($('live').checked ? 'Live requests use Sarvam credits. Your key stays on the local server.' : 'Sample mode is free to explore. Live mode needs Sarvam credits.');
});

// Only phrases are stored here. Credentials never leave the Python server.
const storageKey = 'local-lens.phrasebook.v1';
let saved = [];
let storageAvailable = true;
const fields = ['phrase', 'pronunciation', 'meaning', 'tip'];
function validEntry(entry) {
  return entry && Object.hasOwn(lang, entry.language) && Object.hasOwn(names, entry.situation)
    && typeof entry.live === 'boolean'
    && fields.every(key => typeof entry[key] === 'string' && entry[key].trim() && entry[key].length <= 6000);
}
function identity(entry) { return JSON.stringify([entry.language, entry.phrase]); }
try {
  const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(stored)) {
    const seen = new Set();
    saved = stored.filter(validEntry).filter(entry => {
      const key = identity(entry);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 50);
  }
} catch {
  storageAvailable = false;
  $('book-status').textContent = 'Browser storage is unavailable. You can still save phrases for this visit.';
}
function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(saved));
    storageAvailable = true;
  } catch { storageAvailable = false; }
}
function bookStatus(message) {
  $('book-status').textContent = message + (storageAvailable ? '' : ' Saved for this visit only; browser storage is unavailable.');
}
function updateSaveButton() {
  const exists = current && saved.some(entry => identity(entry) === identity(current));
  $('save').textContent = exists ? 'Saved ✓' : 'Save phrase ♡';
  $('save').disabled = exists;
}
function drawBook() {
  $('saved-count').textContent = saved.length;
  $('practice').disabled = saved.length === 0;
  $('saved-list').replaceChildren();
  if (!saved.length) {
    const empty = document.createElement('p');
    empty.className = 'book-empty';
    empty.textContent = 'A good phrase is worth keeping. Tap “Save phrase” on any card to start your collection.';
    $('saved-list').append(empty);
  }
  for (const entry of saved) {
    const card = document.createElement('article');
    card.className = 'saved-card';
    const label = document.createElement('span');
    label.className = 'mini-label';
    label.textContent = `${entry.language} · ${entry.live ? 'Sarvam' : 'Sample'}`;
    const phrase = document.createElement('h3');
    phrase.textContent = entry.phrase;
    phrase.lang = lang[entry.language];
    const meaning = document.createElement('p');
    meaning.textContent = entry.meaning;
    const actions = document.createElement('div');
    actions.className = 'saved-actions';
    const open = document.createElement('button');
    open.textContent = 'Open phrase ↗';
    open.type = 'button';
    open.setAttribute('aria-label', `Open phrase: ${entry.meaning}`);
    open.addEventListener('click', () => {
      if (busy) { bookStatus('Wait for the current generation to finish before opening a saved phrase.'); return; }
      render(entry, entry.language, entry.situation, entry.live);
      $('language').value = entry.language;
      document.querySelector(`input[name="situation"][value="${entry.situation}"]`).checked = true;
      status('Opened from your phrasebook · no API request made.');
      document.querySelector('.phrase-tools').open = true;
      $('save').closest('section').scrollIntoView({behavior:'smooth', block:'center'});
      $('copy').focus({preventScroll:true});
    });
    const remove = document.createElement('button');
    remove.textContent = 'Remove';
    remove.type = 'button';
    remove.className = 'remove';
    remove.setAttribute('aria-label', `Remove phrase: ${entry.meaning}`);
    remove.addEventListener('click', () => {
      saved = saved.filter(item => identity(item) !== identity(entry));
      persist(); drawBook(); updateSaveButton();
      bookStatus('Phrase removed.');
      $('practice').disabled ? $('save').focus() : $('practice').focus();
    });
    actions.append(open, remove);
    card.append(label, phrase, meaning, actions);
    $('saved-list').append(card);
  }
}
$('save').addEventListener('click', () => {
  if (!current || saved.some(entry => identity(entry) === identity(current))) return;
  if (saved.length >= 50) { bookStatus('Your phrasebook holds 50 phrases. Remove one to make room.'); return; }
  saved.unshift({...current});
  persist(); drawBook(); updateSaveButton();
  bookStatus('Phrase saved. Ready when you need it.');
});
let practiceDeck = [];
let practiceIndex = 0;
function showPracticeCard() {
  const entry = practiceDeck[practiceIndex];
  $('practice-progress').textContent = `RECALL · ${practiceIndex + 1} OF ${practiceDeck.length}`;
  $('practice-language').textContent = entry.language;
  $('practice-phrase').textContent = entry.phrase;
  $('practice-phrase').lang = lang[entry.language];
  $('practice-pronunciation').textContent = entry.pronunciation;
  $('practice-meaning').textContent = entry.meaning;
  $('practice-answer').hidden = true;
  $('reveal').hidden = false;
  $('reveal').setAttribute('aria-expanded', 'false');
  $('next-practice').hidden = true;
  $('next-practice').textContent = practiceIndex === practiceDeck.length - 1 ? 'Finish practice ✓' : 'Next phrase →';
}
$('practice').addEventListener('click', () => {
  if (!saved.length) return;
  practiceDeck = [...saved];
  for (let i = practiceDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [practiceDeck[i], practiceDeck[j]] = [practiceDeck[j], practiceDeck[i]];
  }
  practiceIndex = 0;
  showPracticeCard();
  $('practice-dialog').showModal();
  $('reveal').focus();
});
$('reveal').addEventListener('click', () => {
  $('practice-answer').hidden = false;
  $('reveal').setAttribute('aria-expanded', 'true');
  $('reveal').hidden = true;
  $('next-practice').hidden = false;
  $('next-practice').focus();
});
$('next-practice').addEventListener('click', () => {
  practiceIndex++;
  if (practiceIndex === practiceDeck.length) {
    $('practice-dialog').close();
    bookStatus(`Practice complete — ${practiceDeck.length} ${practiceDeck.length === 1 ? 'phrase' : 'phrases'} revisited.`);
  } else { showPracticeCard(); $('reveal').focus(); }
});
$('close-practice').addEventListener('click', () => $('practice-dialog').close());
const [phrase, pronunciation, meaning, tip] = samples.Hindi.cafe;
render({phrase, pronunciation, meaning, tip}, 'Hindi', 'cafe', false);
drawBook();
$('phrase-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  const language = $('language').value;
  const situation = new FormData(event.target).get('situation');
  const live = $('live').checked;
  if (!live) {
    const [phrase,pronunciation,meaning,tip] = samples[language][situation];
    render({phrase,pronunciation,meaning,tip}, language, situation, false);
    status('Built-in sample phrase · no API request made.');
    return;
  }
  busy = true;
  const controls = [...event.target.elements];
  controls.forEach(el => el.disabled = true);
  $('generate').textContent = 'Finding your words…';
  status('Asking Sarvam for a phrase…');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 40000);
  try {
    const response = await fetch('/api/phrase', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({language,situation,context:$('context').value}), signal:controller.signal});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
    render(data, language, situation, true);
    status('Fresh from Sarvam. Pronunciation is approximate; wording can vary by region.');
  } catch (error) {
    status(error.name === 'AbortError' ? 'This request took too long. Please try again.' : error.message, true);
  } finally {
    clearTimeout(timer);
    busy = false;
    controls.forEach(el => el.disabled = false);
    $('context').disabled = !$('live').checked;
    $('generate').innerHTML = 'Find my words <span>↗</span>';
  }
});
$('copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(`${$('phrase').textContent}\n${$('pronunciation').textContent}\n${$('meaning').textContent}`);
    $('copy').textContent = 'Copied ✓';
    setTimeout(() => $('copy').textContent = 'Copy phrase ⧉', 2000);
  } catch { status('Clipboard unavailable. Select the phrase and copy it manually.', true); }
});

// Authored lessons are deliberately separate from live Sarvam responses.
// Each option: native phrase, pronunciation, English meaning, coaching feedback.
const lessons = {
  cafe: {
    speaker: 'THE CHAI SELLER', goal: 'Your goal: order one chai with less sugar, then ask the price.',
    turns: [
      {line:['क्या लेंगे?', 'Kya lenge?', 'What would you like?'], options:[
        ['एक चाय दीजिए, कृपया।','Ek chai deejiye, kripya.','One tea, please.','“Deejiye” is a respectful way to ask. “Do” is more casual; use “deejiye” with someone you don’t know.'],
        ['स्टेशन कहाँ है?','Station kahaan hai?','Where is the station?','That asks for directions. Here, the seller is asking what you want to order.'],
        ['नहीं, धन्यवाद।','Nahin, dhanyavaad.','No, thank you.','That politely declines. Your goal is to order a chai.'] ]},
      {line:['चीनी कितनी डालूँ?', 'Cheeni kitni daaloon?', 'How much sugar should I add?'], options:[
        ['चीनी कम डालिए, कृपया।','Cheeni kam daaliye, kripya.','Please add less sugar.','“Kam” means less. “Daaliye” keeps your request polite.'],
        ['चीनी ज़्यादा डालिए।','Cheeni zyaada daaliye.','Add more sugar.','“Zyaada” means more. You want less sugar, so look for “kam.”'],
        ['दो चाय दीजिए।','Do chai deejiye.','Give me two teas.','That changes the number of teas. The question is about sugar.'] ]},
      {line:['लीजिए, आपकी चाय।', 'Leejiye, aapki chai.', 'Here is your tea.'], options:[
        ['धन्यवाद। कितने रुपये हुए?','Dhanyavaad. Kitne rupaye hue?','Thank you. How much do I owe?','“Kitne rupaye hue?” asks for the total after an order.'],
        ['एक और चाय दीजिए।','Ek aur chai deejiye.','One more tea, please.','That orders another tea. Ask the total if you’re ready to pay.'],
        ['मुझे चाय नहीं चाहिए।','Mujhe chai nahin chahiye.','I don’t want tea.','That says you don’t want the tea. You’ve received your order; now ask the price.'] ]}
    ]
  },
  directions: {
    speaker: 'A PASSERBY', goal: 'Your goal: find the metro, check which direction to go, and thank the person.',
    turns: [
      {line:['जी, बताइए।', 'Ji, bataaiye.', 'Yes, how can I help?'], options:[
        ['मेट्रो स्टेशन कहाँ है?','Metro station kahaan hai?','Where is the metro station?','“Kahaan” means where. Name the place before it to ask for a location.'],
        ['यह कितने का है?','Yeh kitne ka hai?','How much is this?','That asks a price. You need the location of the metro station.'],
        ['एक चाय दीजिए।','Ek chai deejiye.','One tea, please.','That orders tea. This person is helping you find your way.'] ]},
      {line:['आगे जाकर बाएँ मुड़िए।', 'Aage jaakar baayen mudiye.', 'Go ahead, then turn left.'], options:[
        ['बाएँ, सही समझा मैंने?','Baayen, sahi samjha maine?','Left — did I understand correctly?','Repeating the direction is a useful way to check. “Baayen” means left; “daayen” means right.'],
        ['दाएँ मुड़ना है?','Daayen mudna hai?','Should I turn right?','They said left (“baayen”), not right (“daayen”). Try confirming the direction you heard.'],
        ['चीनी कम डालिए।','Cheeni kam daaliye.','Add less sugar.','That belongs at a tea stall. Here, repeat the direction to confirm it.'] ]},
      {line:['जी हाँ, बाएँ। स्टेशन पास ही है।', 'Ji haan, baayen. Station paas hi hai.', 'Yes, left. The station is nearby.'], options:[
        ['मदद के लिए धन्यवाद।','Madad ke liye dhanyavaad.','Thank you for your help.','“Madad” means help. This is a polite way to close the exchange.'],
        ['मुझे नहीं चाहिए।','Mujhe nahin chahiye.','I don’t want it.','That declines something. Here, thank them for the directions.'],
        ['दो दीजिए।','Do deejiye.','Give me two.','That asks for two items. You’re finishing a conversation about directions.'] ]}
    ]
  },
  shopping: {
    speaker: 'THE FRUIT SELLER', goal: 'Your goal: ask the price of apples, buy half a kilo, and decline a bag.',
    turns: [
      {line:['सेब लेंगे?', 'Seb lenge?', 'Would you like apples?'], options:[
        ['सेब कितने रुपये किलो हैं?','Seb kitne rupaye kilo hain?','How much are the apples per kilo?','Adding “kilo” makes the unit clear, so you know what the quoted price covers.'],
        ['स्टेशन कहाँ है?','Station kahaan hai?','Where is the station?','That asks for directions. Start by asking the price of the apples.'],
        ['दो चाय दीजिए।','Do chai deejiye.','Two teas, please.','That orders tea. This is a fruit stall; ask about the apples.'] ]},
      {line:['सौ रुपये किलो। कितने दूँ?', 'Sau rupaye kilo. Kitne doon?', 'One hundred rupees per kilo. How much would you like?'], options:[
        ['आधा किलो दीजिए।','Aadha kilo deejiye.','Half a kilo, please.','“Aadha” means half. Half a kilo at this lesson’s quoted price costs fifty rupees.'],
        ['दो किलो दीजिए।','Do kilo deejiye.','Two kilos, please.','That asks for two kilos. Your goal is half a kilo — “aadha kilo.”'],
        ['आधा कप दीजिए।','Aadha kap deejiye.','Half a cup, please.','“Kap” is a cup. For this purchase, use the weight unit “kilo.”'] ]},
      {line:['पचास रुपये हुए। थैला चाहिए?', 'Pachaas rupaye hue. Thaila chahiye?', 'That’s fifty rupees. Do you need a bag?'], options:[
        ['नहीं, धन्यवाद। मेरे पास थैला है।','Nahin, dhanyavaad. Mere paas thaila hai.','No, thank you. I have a bag.','“Mere paas … hai” means “I have …”. It explains your polite refusal.'],
        ['हाँ, थैला दीजिए।','Haan, thaila deejiye.','Yes, give me a bag.','That accepts a bag. Your goal is to decline because you already have one.'],
        ['एक किलो और दीजिए।','Ek kilo aur deejiye.','Give me one more kilo.','That adds to your order. They’re asking whether you need a bag.'] ]}
    ]
  }
};
let lessonKey = 'cafe';
let turnIndex = 0;
let answered = false;
let retries = 0;
function lessonTurn(focus = false) {
  const lesson = lessons[lessonKey], turn = lesson.turns[turnIndex];
  answered = false;
  $('lesson-stage').hidden = false;
  $('lesson-complete').hidden = true;
  $('lesson-progress').textContent = `TURN ${turnIndex + 1} OF ${lesson.turns.length}`;
  $('lesson-goal').textContent = lesson.goal;
  $('lesson-speaker').textContent = lesson.speaker;
  $('lesson-line').textContent = turn.line[0];
  $('lesson-sound').textContent = turn.line[1];
  $('lesson-meaning').textContent = turn.line[2];
  $('lesson-meaning').hidden = true;
  $('lesson-hint').textContent = 'Show English hint';
  $('lesson-hint').setAttribute('aria-expanded','false');
  $('lesson-feedback').textContent = '';
  $('lesson-next').hidden = true;
  $('lesson-next').textContent = turnIndex === lesson.turns.length - 1 ? 'See your conversation recap →' : 'Continue conversation →';
  $('lesson-choices').replaceChildren();
  const order = [0,1,2];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  order.forEach(index => {
    const option = turn.options[index], button = document.createElement('button');
    button.type = 'button';
    const native = document.createElement('strong');
    native.lang = 'hi'; native.textContent = option[0];
    const pronunciation = document.createElement('span'); pronunciation.textContent = option[1];
    button.append(native, pronunciation);
    button.addEventListener('click', () => {
      if (answered) return;
      if (index !== 0) {
        retries++;
        button.classList.add('retry');
        button.disabled = true;
        $('lesson-feedback').textContent = `${option[2]} — ${option[3]} Try another reply.`;
        return;
      }
      answered = true;
      button.classList.add('correct');
      [...$('lesson-choices').children].forEach(el => el.disabled = true);
      $('lesson-feedback').textContent = `That fits: “${option[2]}” ${option[3]}`;
      $('lesson-next').hidden = false;
      $('lesson-next').focus({preventScroll:true});
    });
    $('lesson-choices').append(button);
  });
  if (focus) $('lesson-line').focus({preventScroll:true});
}
function startLesson(key) {
  lessonKey = key; turnIndex = 0; retries = 0;
  document.querySelectorAll('[data-lesson]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lesson === key)));
  lessonTurn(true);
}
document.querySelectorAll('[data-lesson]').forEach(button => button.addEventListener('click', () => startLesson(button.dataset.lesson)));
$('restart-lesson').addEventListener('click', () => startLesson(lessonKey));
$('replay-lesson').addEventListener('click', () => startLesson(lessonKey));
$('lesson-hint').addEventListener('click', () => {
  const show = $('lesson-meaning').hidden;
  $('lesson-meaning').hidden = !show;
  $('lesson-hint').textContent = show ? 'Hide English hint' : 'Show English hint';
  $('lesson-hint').setAttribute('aria-expanded', String(show));
});
$('lesson-next').addEventListener('click', () => {
  if (!answered) return;
  turnIndex++;
  if (turnIndex < lessons[lessonKey].turns.length) return lessonTurn(true);
  $('lesson-stage').hidden = true;
  $('lesson-complete').hidden = false;
  $('lesson-summary').textContent = retries ? 'You worked through all three turns. Rehearse again to make the replies feel more familiar.' : 'Three replies, first try. Now say them once more without looking at the pronunciation.';
  $('lesson-recap').replaceChildren();
  for (const turn of lessons[lessonKey].turns) {
    const row = document.createElement('div'); row.className = 'recap-row';
    const them = document.createElement('p'); them.textContent = `They say: ${turn.line[2]}`;
    const phrase = document.createElement('strong'); phrase.lang = 'hi'; phrase.textContent = turn.options[0][0];
    const sound = document.createElement('p'); sound.textContent = turn.options[0][1];
    const meaning = document.createElement('p'); meaning.textContent = turn.options[0][2];
    row.append(them, phrase, sound, meaning); $('lesson-recap').append(row);
  }
  $('lesson-save-status').textContent = '';
  $('save-lesson').disabled = false;
  $('save-lesson').textContent = 'Save these replies ♡';
  $('lesson-complete-title').focus({preventScroll:true});
});
$('save-lesson').addEventListener('click', () => {
  let added = 0, skipped = 0;
  for (const turn of lessons[lessonKey].turns) {
    const [phrase, pronunciation, meaning, tip] = turn.options[0];
    const entry = {phrase, pronunciation, meaning, tip, language:'Hindi', situation:lessonKey, live:false};
    if (saved.some(item => identity(item) === identity(entry))) continue;
    if (saved.length >= 50) { skipped++; continue; }
    saved.unshift(entry); added++;
  }
  persist(); drawBook(); updateSaveButton();
  $('lesson-save-status').textContent = `${added} new ${added === 1 ? 'reply' : 'replies'} saved.${skipped ? ' Your phrasebook is full; remove a phrase to save the rest.' : ' All three replies are in your phrasebook.'}${storageAvailable ? '' : ' Storage is unavailable; saved for this visit only.'}`;
  $('save-lesson').disabled = !skipped;
  $('save-lesson').textContent = skipped ? 'Save remaining replies ♡' : 'Replies saved ✓';
});
lessonTurn();
