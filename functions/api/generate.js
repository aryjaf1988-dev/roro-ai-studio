
export async function onRequest(context) {
  const { request, env } = context;

  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };

  // اختبار أن دالة Cloudflare تعمل
  if (request.method === "GET") {
    return Response.json({
      ok: true,
      message: "Nabd Roro AI server is running",
      keyConfigured: Boolean(env.GEMINI_API_KEY),
    }, { headers });
  }

  if (request.method !== "POST") {
    return Response.json(
      { error: "طريقة الطلب غير مدعومة." },
      { status: 405, headers }
    );
  }

  try {
    if (!env.GEMINI_API_KEY) {
      return Response.json(
        { error: "مفتاح GEMINI_API_KEY غير مضبوط في Cloudflare." },
        { status: 500, headers }
      );
    }

    const body = await request.json();
    const idea = String(body.idea || "").trim();
    const tool = String(body.tool || "story");

    if (!idea) {
      return Response.json(
        { error: "اكتب فكرة أولاً." },
        { status: 400, headers }
      );
    }

    const instructions = {
      story: "اكتب قصة عربية مشوقة ومترابطة بناءً على الفكرة التالية.",
      image: "اكتب وصفاً تفصيلياً لصورة يمكن إنشاؤها بالذكاء الاصطناعي.",
      video: "اكتب وصفاً لمشهد فيديو متحرك مع حركة الشخصيات والكاميرا.",
      voice: "جهز نصاً عربياً واضحاً مناسباً للتعليق الصوتي.",
    };

    const instruction = instructions[tool] || instructions.story;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: instruction + "\n\nالفكرة:\n" + idea,
            }],
          }],
        }),
      }
    );

    const raw = await response.text();
    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      data = {};
    }

    if (!response.ok) {
      console.error("Gemini API error:", response.status, raw);

      return Response.json(
        {
          error: "رفض Gemini الطلب.",
          status: response.status,
          details: data.error?.message || "تعذر قراءة تفاصيل الخطأ.",
        },
        { status: 502, headers }
      );
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!text) {
      return Response.json(
        { error: "لم يُرجع Gemini نصاً. تحقق من صلاحية الطلب." },
        { status: 502, headers }
      );
    }

    return Response.json({ text }, { headers });

  } catch (error) {
    console.error("Nabd Roro server error:", error);

    return Response.json(
      {
        error: "حدث خطأ داخل الخادم.",
        details: error instanceof Error
          ? error.message
          : "خطأ غير معروف",
      },
      { status: 500, headers }
    );
  }
}
