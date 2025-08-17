const API_KEY = "AIzaSyBwigpTFCzZdN1Vbk3Fprtfn2PEmHvqoz4";
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export interface RiasecScores {
  R: number; I: number; A: number; S: number; E: number; C: number;
}

export interface VolunteerPlanRequest {
  riasecScores: RiasecScores;
  topDimensions: string[]; // e.g., ['I','A']
  location?: string;
  interests?: string[];
  skills?: string[];
  values?: string[];
  answeredInterests?: { text: string; score: number; label: string; dim?: string }[];
  answeredSkills?: { text: string; score: number; label: string; dim?: string }[];
  answeredValues?: { text: string; score: number; label: string; dim?: string }[];
}

export interface VolunteerPlanResponse {
  categories: string[]; // e.g., ['salud','educación']
  suggestedKeywords: string[];
  rationale: string;
}

export interface LearningPlanRequest {
  goal?: string; // e.g., 'desarrollador backend'
  riasecScores: RiasecScores;
  topDimensions: string[];
  interests?: string[];
  skills?: string[];
  suggestedKeywords?: string[];
}

export interface LearningModule {
  title: string;
  objectives: string[];
  topics: string[];
  time_hours: number;
  resources: { title: string; url: string }[];
}

export interface LearningPlanResponse {
  track: string; // e.g., 'Ruta introductoria a Analítica de Datos'
  modules: LearningModule[];
}

export interface CareerAdviceRequest {
  riasecScores: RiasecScores;
  topDimensions: string[];
  education?: string;
  skills?: string[];
  interests?: string[];
  location?: string;
}

export interface CareerAdviceResponse {
  title: string;
  summary: string;
  careers: { name: string; why: string; nextSteps: string[] }[];
}

function buildPrompt(req: VolunteerPlanRequest): string {
  const allowed = ['salud','educación','ambiental','social','logística','ti','agricultura'];
  const interestsDump = (req.answeredInterests || [])
    .map(i => `- ${i.text} → ${i.label} (${i.score})${i.dim ? ` [${i.dim}]` : ''}`)
    .join('\n');
  const skillsDump = (req.answeredSkills || [])
    .map(i => `- ${i.text} → ${i.label} (${i.score})${i.dim ? ` [${i.dim}]` : ''}`)
    .join('\n');
  const valuesDump = (req.answeredValues || [])
    .map(i => `- ${i.text} → ${i.label} (${i.score})${i.dim ? ` [${i.dim}]` : ''}`)
    .join('\n');

  return [
    'Eres un orientador vocacional. Con base en el perfil RIASEC y preferencias del usuario, devuelve un JSON válido y estrictamente sólo JSON.',
    'Campos: {"categories": string[], "suggestedKeywords": string[], "rationale": string}.',
    `Las categories deben salir exclusivamente de: ${allowed.join(', ')}.`,
    `RIASEC: ${JSON.stringify(req.riasecScores)}; Top: ${req.topDimensions.join(', ')}`,
    `Intereses: ${(req.interests || []).join(', ') || '—'}`,
    `Habilidades: ${(req.skills || []).join(', ') || '—'}`,
    `Valores: ${(req.values || []).join(', ') || '—'}`,
    req.location ? `Ubicación: ${req.location}` : '',
    interestsDump ? `\nDetalle de intereses:\n${interestsDump}` : '',
    skillsDump ? `\nDetalle de habilidades percibidas:\n${skillsDump}` : '',
    valuesDump ? `\nDetalle de valores:\n${valuesDump}` : '',
    'Responde en español. Minimiza el texto en rationale (máx 2 frases).'
  ].filter(Boolean).join('\n');
}

function extractTextFromGemini(resp: any): string {
  const cand = resp?.candidates?.[0];
  const parts = cand?.content?.parts;
  const text = parts?.[0]?.text || cand?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('\n');
  return text || '';
}

function tryParseJson(text: string): any | null {
  if (!text) return null;
  // Strip code fences ```json ... ```
  const fenced = text.replace(/```json[\s\S]*?```/g, (m) => m.replace(/```json|```/g, '').trim());
  const candidate = fenced || text;
  try { return JSON.parse(candidate); } catch {}
  // Fallback: extract first {...} block
  const match = candidate.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  return null;
}

export async function generateVolunteerPlan(req: VolunteerPlanRequest): Promise<VolunteerPlanResponse> {
  if (!API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY');
  }

  const prompt = buildPrompt(req);

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, topP: 0.9, responseMimeType: 'application/json' },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Gemini error ${response.status}: ${text}`);
  }
  const data = await response.json();
  const text = extractTextFromGemini(data);

  try {
    const parsed = tryParseJson(text) ?? {};
    const categories = Array.isArray(parsed.categories) ? parsed.categories : [];
    const suggestedKeywords = Array.isArray(parsed.suggestedKeywords) ? parsed.suggestedKeywords : [];
    const rationale = typeof parsed.rationale === 'string' ? parsed.rationale : '';
    return { categories, suggestedKeywords, rationale };
  } catch (_err) {
    // Fallback simple parse: try to extract categories lines
    return { categories: [], suggestedKeywords: [], rationale: text?.slice(0, 200) || '' };
  }
}

export async function generateLearningPlan(req: LearningPlanRequest): Promise<LearningPlanResponse> {
  if (!API_KEY) throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY');
  const prompt = [
    'Eres un mentor académico. Genera un PLAN de aprendizaje introductorio en JSON estricto.',
    'Estructura: {"track": string, "modules": [{"title": string, "objectives": string[], "topics": string[], "time_hours": number, "resources": [{"title": string, "url": string}]}...] }',
    'Reglas: 4–6 módulos, 4–8 objetivos/temas por módulo, 6–12 h total por módulo, recursos deben ser genéricos (sin dominios privados).',
    req.goal ? `Meta declarada: ${req.goal}` : '',
    `RIASEC top: ${req.topDimensions.join(', ')}; scores: ${JSON.stringify(req.riasecScores)}`,
    `Intereses: ${(req.interests || []).join(', ') || '—'}`,
    `Habilidades: ${(req.skills || []).join(', ') || '—'}`,
    `Keywords sugeridas: ${(req.suggestedKeywords || []).join(', ') || '—'}`,
    'Responde en español. Sólo JSON, sin texto adicional.'
  ].filter(Boolean).join('\n');

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, responseMimeType: 'application/json' } }),
  });
  if (!response.ok) throw new Error(`Gemini error ${response.status}`);
  const data = await response.json();
  const text = extractTextFromGemini(data);
  try {
    const parsed = tryParseJson(text) ?? {};
    return { track: parsed.track || 'Ruta de aprendizaje', modules: Array.isArray(parsed.modules) ? parsed.modules : [] };
  } catch {
    return { track: 'Ruta de aprendizaje', modules: [] };
  }
}

// default export is declared at the end to include all public functions
// Simple connectivity check to Gemini
export async function pingGemini(): Promise<{ ok: boolean; reason?: string }> {
  try {
    if (!API_KEY) {
      return { ok: false, reason: 'Missing EXPO_PUBLIC_GEMINI_API_KEY' };
    }
    const resp = await fetch(`${GEMINI_ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'ping' }] }],
        generationConfig: { temperature: 0.0 },
      }),
    });
    if (!resp.ok) {
      return { ok: false, reason: `HTTP ${resp.status}` };
    }
    const data = await resp.json();
    const text = extractTextFromGemini(data);
    return { ok: typeof text === 'string' };
  } catch (e: any) {
    return { ok: false, reason: e?.message || String(e) };
  }
}
 
export async function generateCareerAdvice(req: CareerAdviceRequest): Promise<CareerAdviceResponse> {
  if (!API_KEY) throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY');
  const lines = [
    'You are a career counselor. Return STRICT JSON only, no extra text.',
    'Schema: {"title": string, "summary": string, "careers": [{"name": string, "why": string, "nextSteps": string[]}]}',
    `RIASEC scores: ${JSON.stringify(req.riasecScores)}; Top: ${req.topDimensions.join(', ')}`,
    req.education ? `Education: ${req.education}` : '',
    `Skills: ${(req.skills || []).join(', ') || '—'}`,
    `Interests: ${(req.interests || []).join(', ') || '—'}`,
    req.location ? `Location (city, country): ${req.location}` : '',
    'Guidelines: 3–5 careers. Keep "summary" to 2 sentences. Use clear, concise language for teens.',
  ].filter(Boolean).join('\n');

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: lines }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    }),
  });
  if (!response.ok) throw new Error(`Gemini error ${response.status}`);
  const data = await response.json();
  const text = extractTextFromGemini(data);
  try {
    const parsed = tryParseJson(text) ?? {};
    const careers = Array.isArray(parsed.careers) ? parsed.careers : [];
    return {
      title: typeof parsed.title === 'string' ? parsed.title : 'Career Recommendations',
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      careers: careers.map((c: any) => ({
        name: typeof c?.name === 'string' ? c.name : 'Career',
        why: typeof c?.why === 'string' ? c.why : '',
        nextSteps: Array.isArray(c?.nextSteps) ? c.nextSteps : [],
      })),
    };
  } catch {
    return { title: 'Career Recommendations', summary: text?.slice(0, 200) || '', careers: [] };
  }
}

export default { generateVolunteerPlan, generateCareerAdvice, generateLearningPlan };
