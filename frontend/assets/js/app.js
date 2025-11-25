const API = '';
const intentsList = document.getElementById('intentsList');
const addIntentBtn = document.getElementById('addIntent');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const chatWindow = document.getElementById('chatWindow');
const msgInput = document.getElementById('msgInput');
const sendMsg = document.getElementById('sendMsg');
const bizName = document.getElementById('bizName');
const bizSite = document.getElementById('bizSite');
const logsEl = document.getElementById('logs');
const refreshLogs = document.getElementById('refreshLogs');

let INTENTS = [];
let LOGS = [];

function createIntentCard(intent, idx) {
  const wrapper = document.createElement('div');
  wrapper.className = 'border rounded-md p-3 bg-gray-50';
  wrapper.innerHTML = `
    <div class="flex gap-2">
      <input class="flex-1 border rounded px-2 py-1 text-sm name" placeholder="Intent name" value="${intent.name || ''}" />
      <button class="remove text-red-500 text-sm">Remove</button>
    </div>
    <div class="mt-2">
      <input class="w-full border rounded px-2 py-1 text-sm patterns" placeholder="keywords comma separated" value="${(intent.patterns||[]).join(', ')}" />
    </div>
    <div class="mt-2">
      <textarea class="w-full border rounded px-2 py-1 text-sm reply" rows="2" placeholder="Reply text">${intent.reply||''}</textarea>
    </div>
  `;
  const nameInput = wrapper.querySelector('.name');
  const patternsInput = wrapper.querySelector('.patterns');
  const replyInput = wrapper.querySelector('.reply');
  const removeBtn = wrapper.querySelector('.remove');

  nameInput.addEventListener('input', () => INTENTS[idx].name = nameInput.value);
  patternsInput.addEventListener('input', () => INTENTS[idx].patterns = patternsInput.value.split(',').map(s=>s.trim()).filter(Boolean));
  replyInput.addEventListener('input', () => INTENTS[idx].reply = replyInput.value);
  removeBtn.addEventListener('click', () => { INTENTS.splice(idx,1); renderIntents(); });

  return wrapper;
}

function renderIntents() {
  intentsList.innerHTML = '';
  INTENTS.forEach((it, i) => intentsList.appendChild(createIntentCard(it, i)));
}

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    INTENTS = data.intents || [];
    LOGS = data.logs || [];
    bizName.textContent = data.businessName || '';
    bizSite.textContent = data.website || '';
    renderIntents();
    renderLogs();
  } catch (err) {
    console.error(err);
  }
}

async function saveIntents() {
  try {
    const res = await fetch('/api/config/intents', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({intents: INTENTS})
    });
    if (!res.ok) throw new Error('Failed');
    alert('Saved ✅');
    loadConfig();
  } catch (err) {
    alert('Save failed');
    console.error(err);
  }
}

function appendChat(msg, from='bot') {
  const el = document.createElement('div');
  el.className = 'p-2';
  el.innerHTML = `<div class="${from==='user'?'text-right':''}"><div class="inline-block ${from==='user'?'bg-blue-600 text-white':'bg-white'} rounded px-3 py-2">${msg}</div></div>`;
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

sendMsg.addEventListener('click', ()=> {
  const text = msgInput.value.trim();
  if(!text) return;
  appendChat(text,'user');
  msgInput.value='';
  // local intent detection
  const lower = text.toLowerCase();
  let replied=false;
  for(const it of INTENTS){
    for(const p of (it.patterns||[])){
      if(p && lower.includes(p.toLowerCase())){
        appendChat(it.reply,'bot');
        replied=true;
        break;
      }
    }
    if(replied) break;
  }
  if(!replied) appendChat('🤖 AI fallback (real bot will call OpenAI)','bot');
});

addIntentBtn.addEventListener('click', ()=> { INTENTS.push({name:'', patterns:[], reply:''}); renderIntents(); });
saveBtn.addEventListener('click', saveIntents);
resetBtn.addEventListener('click', loadConfig);
refreshLogs.addEventListener('click', loadConfig);

function renderLogs(){
  logsEl.innerHTML='';
  LOGS.slice().reverse().forEach(l=> {
    const li = document.createElement('li');
    li.className='text-xs text-gray-600';
    li.textContent = `${new Date(l.ts).toLocaleString()} — ${l.from || 'bot'} → ${l.body}`;
    logsEl.appendChild(li);
  });
}

loadConfig();
