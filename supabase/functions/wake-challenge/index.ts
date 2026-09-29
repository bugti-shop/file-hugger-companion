// Generates a short wake-up challenge (question + one-word/number answer) tied to the user's morning goal.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { goal } = await req.json().catch(() => ({}));
    const text = typeof goal === "string" ? goal.trim().slice(0, 300) : "";
    if (!text) return json({ error: "Please write your morning goal first." }, 400);
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured." }, 500);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      signal: req.signal,
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
        instructions:
          "You create tiny wake-up challenges that a sleepy person must solve to stop their alarm. The challenge must relate to the user's morning goal, take 10-20 seconds, and have ONE short answer (a single word or a number, no punctuation). Examples: simple arithmetic themed on the goal, unscramble a goal-related word, fill a missing word. Reply ONLY with JSON: {\"question\":\"...\",\"answer\":\"...\"}. Question under 120 characters, in the same language as the goal.",
        input: `Morning goal: ${text}`,
      }),
    });

    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => "");
      console.error("gateway error", res.status, errText.slice(0, 300));
      const msg = res.status === 429 ? "Too many requests, try again in a moment."
        : res.status === 402 ? "AI credits have run out."
        : "Could not create a challenge right now.";
      return json({ error: msg }, res.status);
    }

    // Consume the SSE stream and accumulate output text.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "", out = "", failed = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const ev = JSON.parse(data);
          if (ev.type === "response.output_text.delta") out += ev.delta ?? "";
          else if (ev.type === "response.failed" || ev.type === "error") failed = ev.error?.message ?? ev.response?.error?.message ?? "failed";
        } catch { /* partial */ }
      }
    }
    if (failed) { console.error("stream failed", failed); return json({ error: "Could not create a challenge right now." }, 502); }

    const match = out.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : null;
    const question = String(parsed?.question ?? "").trim();
    const answer = String(parsed?.answer ?? "").trim();
    if (!question || !answer) return json({ error: "The AI returned an empty challenge. Please try again." }, 502);
    return json({ question, answer });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return new Response(null, { status: 499 });
    console.error(e);
    return json({ error: "Something went wrong." }, 500);
  }
});
