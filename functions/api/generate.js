export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const idea = String(body.idea || "").trim();
    const tool = String(body.tool || "story");

    if (!idea) {
      return Response.json(
        { error: "اكتب فكرتك أولاً" },
        { status: 400 }
      );
    }

    const instructions = {
      story: "اكتب قصة عربية مشوقة ومترابطة.",
      image: "اكتب وصفاً تفصيلياً لصورة لإنشائها بالذكاء الاصطناعي.",
      video: "اكتب وصفاً لمشهد فيديو متحرك مع حركة الشخصيات والكاميرا.",
      voice: "حسّن النص ليكون مناسباً للتعليق الصوتي باللغة العربية."
    };

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": context.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: instructions[tool] + "\n\n" + idea
            }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: "تعذر الاتصال بالذكاء الاصطناعي. تحقق من إعدادات المفتاح." },
        { status: 502 }
      );
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("") || "لم يصل نص من النموذج.";

    return Response.json({ text });
  } catch {
    return Response.json(
      { error: "حدث خطأ. تحقق من الإعدادات وحاول مجدداً." },
      { status: 500 }
    );
  }
}
