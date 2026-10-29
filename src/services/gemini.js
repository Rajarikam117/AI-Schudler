import { httpError } from '../middleware/errorHandler.js';
const timeoutMs=25000;
const defaultModel='gemini-3.8-flash';
function apiKey(){return process.env.GOOGLE_API_KEY||process.env.GEMINI_API_KEY||'';}
export function geminiStatus(){return {configured:Boolean(apiKey()),model:process.env.GEMINI_MODEL||defaultModel};}
async function generate(prompt, { json=false }={}) {
  const key=apiKey(); if(!key) throw httpError(503,'Gemini API key is not configured.','AI is not configured yet. Add GOOGLE_API_KEY to .env.local, then restart the app. Task management works without it.');
  const model=(process.env.GEMINI_MODEL||defaultModel).trim();
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try {
    const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.3,...(json?{responseMimeType:'application/json'}:{})}})});
    if(!response.ok){const code=response.status;let detail='';try{detail=(await response.json())?.error?.message||'';}catch{}let message=detail||'Gemini request failed.';if(code===400)message=detail||'Gemini rejected the request. Check model and request format.';else if(code===401||code===403)message=detail||'Gemini API key is invalid or lacks permission.';else if(code===404)message=detail||`Gemini model "${model}" was not found or is unavailable to this API key. Update GEMINI_MODEL in .env.local.`;else if(code===429)message=detail||'Gemini quota or rate limit exceeded. Try again later.';throw httpError(code===429?429:code===400?400:code===404?502:code===401||code===403?502:502,'Gemini API returned HTTP '+code+'.',message);}
    const body=await response.json(); const text=body?.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('').trim();
    if(!text) throw httpError(502,'Gemini returned an empty response.','Gemini returned an empty response. Please try again.');
    return text;
  }catch(e){if(e.name==='AbortError')throw httpError(504,'Gemini request timed out.','Gemini timed out. Try again.');if(e.status)throw e;throw httpError(502,'Could not connect to Gemini.','Could not reach Gemini. Check your internet connection and try again.');}finally{clearTimeout(timer);}
}
export async function generateSchedule(payload, tasks){
  const prompt=`You are a careful scheduling assistant. Return ONLY JSON matching {"items":[{"title":"string","taskId":"existing ID or null","description":"string","startTime":"HH:MM","endTime":"HH:MM","durationMinutes":integer,"priority":"Low|Medium|High|Critical","category":"string"}],"unscheduled":[{"title":"string","reason":"string"}],"explanation":"string"}. Date: ${payload.date}. Available window: ${payload.startTime} to ${payload.endTime}. Break duration preference: ${payload.breakMinutes||0} minutes. Fixed commitments: ${JSON.stringify(payload.commitments||[])}. Preferences: ${String(payload.preferences||'').slice(0,1500)}. Tasks: ${JSON.stringify(tasks.map(({id,title,description,estimatedDuration,deadline,priority,category,dependencies})=>({id,title,description,estimatedDuration,deadline,priority,category,dependencies}))).slice(0,12000)}. Prioritize deadline urgency and priority. Never overlap tasks, schedule outside the window, ignore fixed commitments, invent task IDs, or claim unscheduled tasks are done. Report tasks that cannot fit in unscheduled with reasons. Return a valid JSON object.`;
  const text=await generate(prompt,{json:true}); try{return JSON.parse(text);}catch{throw httpError(502,'Gemini returned malformed JSON.','Gemini returned an unreadable schedule. Your input has been retained; please regenerate.');}
}
export async function chatWithGemini(messages, context){
 const safe=messages.slice(-10).map(m=>({role:m.role,content:m.content.slice(0,2000)}));
 const prompt=`You are the AI Scheduler assistant. Help with scheduling and task planning. Do not claim to modify data; the app requires user confirmation and explicit save actions. Answer clearly and concisely. Current task context: ${JSON.stringify(context).slice(0,6000)}. Conversation:\n${safe.map(m=>`${m.role.toUpperCase()}: ${m.content}`).join('\n')}`;
 return await generate(prompt);
}
