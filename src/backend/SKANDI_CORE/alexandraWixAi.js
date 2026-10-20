// SKANDI V12 — Alexandra text-only Wix AI transport for Wix Studio.
// This core does not read private bookings or create cases; canonical Customer Support
// methods retain all authenticated customer and staff workflows.
import { generateText } from 'ai';
import { openai } from '@wix/ai';
import { randomUUID, createHmac, timingSafeEqual } from 'crypto';
import { secrets } from 'wix-secrets-backend.v2';
import { elevate } from 'wix-auth';
import { ALEXANDRA_BRAND_KNOWLEDGE } from 'backend/SKANDI_CORE/alexandraKnowledge';

const MODEL = 'gpt-4.1-mini'; // Listed by Wix AI APIs during source verification, subject to Wix availability.
const LIMIT = 1700;
const MAX_HISTORY = 8;
const MAX_OUTPUT = 1900;
const SESSION_MINUTES = 30;
const MAX_MESSAGES = 24;
const sessions = new Map(); // optional per-worker throttling; signed tokens validate across Wix workers.
const elevatedGetSecretValue = elevate(secrets.getSecretValue);
async function sessionSecret() {
  const raw = await elevatedGetSecretValue('SKANDI_ALEXANDRA_WIX_AI_SESSION_SECRET');
  const value = typeof raw === 'string' ? raw : (raw?.value ?? raw?.secretValue ?? raw?.secret?.value ?? '');
  if(typeof value!=='string'||value.length<32) throw error('ALEXANDRA_SECRET_MISSING','Alexandra is temporarily unavailable. Please contact SKANDI Customer Service.');
  return value;
}
function sessionHmac(secret, nonce, expiry) {return createHmac('sha256',secret).update(`${nonce}_${expiry}`).digest('hex').slice(0,24);}
const clean = (value, max = LIMIT) => String(value ?? '').trim().slice(0, max);
const obj = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const deny = message => /(?:\/riaintra(?:\b|\/)|\/backend(?:\b|\/)|\/src\/|\/\_functions(?:\b|\/)|(?:api[_ -]?key|secret|private[_ -]?token|supabase[_ -]?key|system[_ -]?prompt|staff[_ -]?password|admin[_ -]?password)|\b(?:altea|ria\s*intra)\b)/i.test(message);
function redact(value) {
  return clean(value, LIMIT).replace(/\b(?:\d[ -]*?){13,19}\b/g, '[payment details removed]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email removed]')
    .replace(/\b(?:sk_live|pk_live|sk_test|whsec|Bearer)\S+/gi, '[credential removed]')
    .replace(/\b(?:passport|cvv|password|otp|one[- ]time code)\s*[:=]?\s*[^\s,;]{4,}/gi,'[sensitive detail removed]');
}
function error(code, publicMessage) { const e = new Error(code); e.code=code; e.publicMessage=publicMessage; return e; }
function policyResponse(text) {
  if (deny(text) || /(?:https?:\/\/[^\s]+\/(?:riaintra|backend|_functions)|\b(?:api[_ -]?key|secret[_ -]?token)\b)/i.test(text)) {
    return 'I can help with SKANDI travel and customer service questions, but internal systems are not available in this chat. For account help, please use My Profile or contact SKANDI Customer Service.';
  }
  return text;
}
export async function startAlexandraAiSessionCore() {
  const secret=await sessionSecret();
  const nonce=randomUUID().replace(/-/g,'');
  const expiresAt=Date.now()+SESSION_MINUTES*60*1000;
  const expiry=expiresAt.toString(36);
  const sessionId=`alexandra_wix_${nonce}_${expiry}_${sessionHmac(secret,nonce,expiry)}`;
  if(sessions.size>1500){for(const [id,row] of sessions){if(row.expiresAt<Date.now())sessions.delete(id);} }
  sessions.set(sessionId,{count:0,expiresAt});
  return {ok:true,loggedIn:false,session:{sessionId,provider:'Wix AI APIs',agentName:'Alexandra',agentRuntime:'Wix AI SDK',transport:'text',expiresAt:new Date(expiresAt).toISOString()}};
}
export async function answerAlexandraAiMessageCore(input = {}) {
  const payload=obj(input);
  const sessionId=clean(payload.sessionId,90);
  const question=clean(payload.message,LIMIT);
  const match=/^alexandra_wix_([0-9a-f]{32})_([0-9a-z]{8,11})_([0-9a-f]{24})$/.exec(sessionId);
  if(!match)throw error('ALEXANDRA_SESSION_INVALID','Open Alexandra again to start a new chat.');
  const secret=await sessionSecret();
  const expected=Buffer.from(sessionHmac(secret,match[1],match[2]),'ascii');
  const supplied=Buffer.from(match[3],'ascii');
  if(!timingSafeEqual(expected,supplied))throw error('ALEXANDRA_SESSION_INVALID','Open Alexandra again to start a new chat.');
  const expiresAt=parseInt(match[2],36);
  if(!Number.isFinite(expiresAt)||Date.now()>expiresAt||expiresAt>Date.now()+SESSION_MINUTES*60*1000+30000)throw error('ALEXANDRA_SESSION_EXPIRED','This chat session has ended. Reopen Alexandra to continue.');
  if(!question)throw error('ALEXANDRA_MESSAGE_REQUIRED','Enter a message before sending.');
  let session=sessions.get(sessionId);
  if(!session){session={count:0,expiresAt};sessions.set(sessionId,session);}
  if(session.count>=MAX_MESSAGES)throw error('ALEXANDRA_SESSION_LIMIT','This chat has reached its message limit. Start a new session or contact SKANDI Customer Service.');
  session.count+=1;
  if(deny(question))return {ok:true,sessionId,reply:'I can help with public travel and customer-service questions, but cannot provide access to internal SKANDI systems. For your booking, use the secure My Profile area or contact SKANDI Customer Service.',provider:'Wix AI APIs'};
  const history=Array.isArray(payload.history)?payload.history.slice(-MAX_HISTORY):[];
  const messages=history.filter(x=>['user','assistant'].includes(x?.role)&&typeof x?.content==='string')
    .map(x=>({role:x.role,content:redact(x.content).slice(0,850)}));
  messages.push({role:'user',content:redact(question)});
  try {
    const result=await generateText({model:openai(MODEL),system:ALEXANDRA_BRAND_KNOWLEDGE,messages,maxOutputTokens:350,temperature:0.3});
    const text=policyResponse(clean(result?.text,MAX_OUTPUT));
    if(!text)throw error('ALEXANDRA_EMPTY','Alexandra could not prepare a response. Please try again.');
    return {ok:true,sessionId,reply:text,provider:'Wix AI APIs'};
  } catch(e) {
    if(e?.code==='ALEXANDRA_EMPTY')throw e;
    console.error('[SKANDI Alexandra Wix AI]',String(e?.name||'AI_CALL_FAILED').slice(0,80));
    throw error('ALEXANDRA_UNAVAILABLE','Alexandra is temporarily unavailable. Please use SKANDI Customer Service for help.');
  }
}
