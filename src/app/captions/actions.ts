'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export async function generateCaption(prompt: string, vibe: string) {
  if (typeof prompt !== 'string' || typeof vibe !== 'string') return { error: 'Invalid request.' };
  prompt = prompt.trim();
  if (prompt.length < 6 || prompt.length > 240 || !['dry', 'wholesome', 'unhinged'].includes(vibe)) {
    return { error: 'Describe your moment in 6–240 characters and choose a tone.' };
  }
  let finish: ((status: string, errorCode?: string, captionId?: string) => Promise<void>) | undefined;
  try {
    const db = await createClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return { error: 'Please sign in to generate a caption.' };
    const apiKey = process.env.OPENROUTER_API_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!apiKey || !serviceKey) return { error: 'Generation is not configured yet. Please try again later.' };
    const admin = createAdminClient(process.env.SUPABASE_URL!, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const {data:mix,error:mixError}=await admin.from('prompt_chain_mix').select('chain_id,weight').eq('enabled',true).gt('weight',0);
    if(mixError||!mix?.length) return {error:'Generation is temporarily paused. Please try again later.'};
    let ticket=Math.random()*mix.reduce((sum,row)=>sum+row.weight,0);
    const selected=mix.find(row=>(ticket-=row.weight)<0) ?? mix[mix.length-1];
    const {data:steps,error:stepsError}=await admin.from('prompt_chain_steps').select('role,template').eq('chain_id',selected.chain_id).order('position');
    if(stepsError||!steps?.length||!steps.some(step=>step.role==='system')||!steps.some(step=>step.role==='user')) return {error:'Generation configuration is unavailable.'};
    const systemPrompt=steps.filter(step=>step.role==='system').map(step=>step.template).join('\n');
    const model = 'openrouter/free';
    const { data: allowed, error: quotaError } = await db.rpc('reserve_caption_attempt');
    if (quotaError) return { error: 'Could not check your generation allowance. Please try again.' };
    if (!allowed) return { error: 'You have used five attempts in the last 24 hours. Come back later.' };
    const started=Date.now();
    const {data:request,error:requestError}=await admin.from('generation_requests').insert({user_id:user.id,prompt,tone:vibe,status:'pending',chain_id:selected.chain_id,model_key:model}).select('id').single();
    if(requestError||!request) return {error:'Could not start generation. Please try again later.'};
    finish=async(status,errorCode,captionId)=>{
      const {error}=await admin.from('generation_requests').update({status,error_code:errorCode??null,caption_id:captionId??null,duration_ms:Date.now()-started,finished_at:new Date().toISOString()}).eq('id',request.id);
      if(error) console.error('Generation status could not be recorded.');
    };
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model,
        messages: steps.map(step=>({role:step.role,content:step.role==='user'?JSON.stringify({moment:prompt,tone:vibe}):step.template})),
        temperature: 0.9,
        max_tokens: 1024,
      }),
    });
    if (!response.ok) {await finish('failed','provider_http_error');return { error: 'The AI service is unavailable. Your draft is still here; try again later.' };}
    const result = await response.json();
    const candidate = result.choices?.[0];
    const caption = typeof candidate?.message?.content === 'string' ? candidate.message.content.trim() : '';
    const actualModel = typeof result.model === 'string' ? result.model : model;
    const tokenCount=(value:unknown)=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0&&value<=2147483647?value:null;
    const {error:responseError}=await admin.from('llm_responses').insert({request_id:request.id,model:actualModel,output:caption.slice(0,10000),finish_reason:typeof candidate?.finish_reason==='string'?candidate.finish_reason:null,prompt_tokens:tokenCount(result.usage?.prompt_tokens),completion_tokens:tokenCount(result.usage?.completion_tokens)});
    if(responseError) {await finish('failed','response_storage_error');return {error:'The generated response could not be recorded. Please try again.'};}
    if (candidate?.finish_reason !== 'stop' || !caption || caption.length > 400) {await finish('failed','unusable_output');return { error: 'No usable caption was returned. Try a different moment.' };}
    // Only the trusted server can publish AI outputs. Browser credentials cannot insert them.
    const { data:saved,error } = await admin.from('ai_captions').insert({ user_id: user.id, prompt, system_prompt: systemPrompt, caption, vibe, model: actualModel }).select('id').single();
    if (error) {await finish('failed','caption_storage_error');return { error: 'The caption could not be saved. Please try again.' };}
    await finish('succeeded',undefined,saved.id);
    revalidatePath('/captions');
    return { success: 'Your caption is on the board.' };
  } catch {
    if(finish) {try {await finish('failed','request_interrupted');} catch { /* Do not disclose provider errors or credentials. */ }}
    return { error: 'The request did not finish. Your draft is preserved; try again.' };
  }
}

export async function rateCaption(id: string, value: number) {
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || ![-1, 1].includes(value)) return { error: 'Invalid vote.' };
  try {
    const db = await createClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return { error: 'Please sign in to vote.' };
    const { error } = await db.rpc('cast_caption_vote', { target: id, rating: value });
    if (error) return { error: 'Your vote could not be saved. Please try again.' };
    revalidatePath('/captions');
    return { success: 'Vote saved.' };
  } catch {
    return { error: 'Connection interrupted. Please try again.' };
  }
}
