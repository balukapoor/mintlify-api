// openai-shim.js - With simple <built> completion detection
import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import onFinished from "on-finished";
import { createAsyncGenerator } from "./server.js";
import http from "node:http";
import { encodingForModel } from "js-tiktoken";

// ─────────────────────────────────────────────────────
//   TOKEN COUNTING FUNCTIONS
// ─────────────────────────────────────────────────────
function countTokens(text, model = "gpt-3.5-turbo") {
  try {
    const encoding = encodingForModel(model);
    return encoding.encode(text).length;
  } catch (error) {
    return Math.ceil(text.length / 4);
  }
}

function countMessageTokens(messages, model = "gpt-3.5-turbo") {
  try {
    const encoding = encodingForModel(model);
    let totalTokens = 0;

    for (const message of messages) {
      totalTokens += 4;
      totalTokens += encoding.encode(message.content || "").length;
      totalTokens += encoding.encode(message.role || "").length;
    }
    totalTokens += 2;
    return totalTokens;
  } catch (error) {
    let total = 0;
    for (const message of messages) {
      total += Math.ceil((message.content || "").length / 4);
      total += Math.ceil((message.role || "").length / 4);
      total += 4;
    }
    return total + 2;
  }
}

// ─────────────────────────────────────────────────────
//   SIMPLE COMPLETION DETECTION
// ─────────────────────────────────────────────────────
function hasCompletionMarker(content) {
  return content.trim().endsWith("<built>");
}

// ─────────────────────────────────────────────────────
//   AUTOMATIC CONTINUATION CONFIGURATION
// ─────────────────────────────────────────────────────
const MAX_CONTINUATIONS = process.env.NODE_ENV === 'production' ? 3 : 15; // Maximum number of continuation requests
const CONTINUATION_DELAY = 2000; // Delay between continuation requests (ms)

// ─────────────────────────────────────────────────────
//   APP SETUP & MIDDLEWARE
// ─────────────────────────────────────────────────────
const app = express();

app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "50mb" }));

app.use((req, _res, next) => {
  if (req.headers["content-length"]) {
    console.log(
      "⬇️  REQUEST BODY SIZE:",
      req.headers["content-length"],
      "bytes"
    );
  }
  next();
});

// ─────────────────────────────────────────────────────
//   SERVER WITH DISABLED TIMEOUTS
// ─────────────────────────────────────────────────────
const server = http.createServer(app);

server.keepAliveTimeout = 0;
server.headersTimeout = 0;
server.requestTimeout = 0;
server.timeout = 0;

console.log("🔧 Server timeouts disabled");

// ─────────────────────────────────────────────────────
//   MAIN ROUTE HANDLER
// ─────────────────────────────────────────────────────
app.post("/v1/chat/completions", async (req, res) => {
  const requestId = `req_${Date.now()}`;
  console.log(`\n🆔 REQUEST ID: ${requestId}`);
  console.log("════════════════════════════════════════════════════════");

  let { messages = [], stream = false } = req.body ?? {};
  
  // Allow natural streaming mode - let GenVibe control stream/non-stream behavior
  if (!stream) {
    console.log("📡 Non-streaming request detected - allowing natural mode");
  }

  // ═══ ADD <built> COMPLETION INSTRUCTION ═══
  const systemMessageIndex = messages.findIndex((m) => m.role === "system");
  if (systemMessageIndex !== -1) {
    const originalContent = messages[systemMessageIndex].content || "";
    const completionInstruction = `\n\nIMPORTANT: When you have completely finished building the application and provided all necessary code, end your response with the exact word: <built>

This marker indicates the application is complete and ready to use. Do not include <built> unless the application is fully complete.

NOTE: If your response gets cut off due to length limits, I will automatically continue the conversation to get the complete response. You should continue exactly from where you left off when prompted.`;

    messages[systemMessageIndex].content = originalContent + completionInstruction;
    console.log(
      "🏷️  Added <built> completion marker instruction with auto-continuation support"
    );
  }

  console.log("📋 REQUEST INFO:");
  console.log("   - Stream mode:", stream);
  console.log("   - Message count:", messages.length);
  console.log(
    "   - Messages:",
    messages.map((m) => `${m.role}: ${m.content?.slice(0, 50)}...`)
  );

  const fixed = messages.map((m) => ({
    ...m,
    parts: m.parts ?? [{ type: "text", text: m.content }],
  }));

  const inputTokens = countMessageTokens(messages);
  console.log("📥 INPUT TOKENS:", inputTokens);

  // ─── NON-STREAMING MODE WITH AUTO-CONTINUATION ───
  if (!stream) {
    console.log("🚀 STARTING NON-STREAM REQUEST WITH AUTO-CONTINUATION...");
    console.log(`📋 Max continuations allowed: ${MAX_CONTINUATIONS}`);

    let full = "";
    let streamCompleted = false;
    let chunkCount = 0;
    let requestCount = 0;
    const startTime = Date.now();

    try {
      for await (const chunk of createAsyncGenerator(
        fixed,
        null,
        MAX_CONTINUATIONS
      )) {
        full += chunk;
        chunkCount++;

        if (chunkCount % 100 === 0) {
          console.log(
            `   📦 Received ${chunkCount} chunks, ${full.length} chars so far...`
          );
        }
      }
      streamCompleted = true;
      console.log("✅ STREAM WITH AUTO-CONTINUATION COMPLETED");
    } catch (error) {
      console.log("❌ STREAM ERROR:", error.message);
    }

    // ═══ AUTOMATIC COMPLETION DETECTION ═══
    const isComplete = hasCompletionMarker(full);
    const finishReason = isComplete ? "stop" : "length";

    console.log(
      `🏷️  COMPLETION CHECK: ${
        isComplete ? "COMPLETE" : "INCOMPLETE"
      } (${finishReason})`
    );
    if (isComplete) {
      console.log("   ✅ Found <built> marker - application complete");
    } else {
      console.log(
        "   ⚠️  No <built> marker - response may be incomplete despite auto-continuation"
      );
    }

    const outputTokens = countTokens(full);
    const duration = Date.now() - startTime;
    const tokensPerSecond =
      duration > 0 ? Math.round((outputTokens / duration) * 1000) : 0;

    console.log("\n📊 FINAL STATISTICS:");
    console.log("   📤 OUTPUT TOKENS:", outputTokens);
    console.log("   ⏱️  DURATION:", duration + "ms");
    console.log("   ⚡ TOKENS/SEC:", tokensPerSecond);
    console.log("   🏁 STATUS:", streamCompleted ? "COMPLETED" : "TRUNCATED");
    console.log("   🏷️  FINISH REASON:", finishReason);
    console.log("   📊 TOTAL TOKENS:", inputTokens + outputTokens);
    console.log("   📝 RESPONSE LENGTH:", full.length, "characters");
    console.log("   📦 TOTAL CHUNKS:", chunkCount);

    console.log("\n📄 RESPONSE ENDING (last 100 chars):");
    console.log("   ..." + full.slice(-100).replace(/\n/g, " "));
    console.log("════════════════════════════════════════════════════════");

    return res.json({
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "mintlify",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: full },
          finish_reason: finishReason,
        },
      ],
      usage: {
        prompt_tokens: inputTokens,
        completion_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
      },
    });
  }

  // ─── STREAMING MODE WITH AUTO-CONTINUATION ───
  console.log("🚀 STARTING STREAMING REQUEST WITH AUTO-CONTINUATION...");
  console.log(`📋 Max continuations allowed: ${MAX_CONTINUATIONS}`);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  onFinished(res, (err) => {
    console.log("🔚 STREAM RESPONSE FINISHED");
    console.log("   - Error:", err ? err.message : "none");
    console.log("════════════════════════════════════════════════════════");
  });

  const heartbeat = setInterval(() => {
    res.write(":\n\n");
    console.log("💓 Heartbeat sent");
  }, 10_000);

  let streamOutput = "";
  let streamCompleted = false;
  let chunkCount = 0;
  let lastLogTime = Date.now();
  const startTime = Date.now();

  try {
    for await (const chunk of createAsyncGenerator(
      fixed,
      null,
      MAX_CONTINUATIONS
    )) {
      streamOutput += chunk;
      chunkCount++;

      const now = Date.now();
      if (now - lastLogTime > 5000) {
        console.log(
          `   📡 Streaming... ${chunkCount} chunks, ${
            streamOutput.length
          } chars, ${Math.round((now - startTime) / 1000)}s elapsed`
        );
        lastLogTime = now;
      }

      const payload = {
        id: `chatcmpl-${Date.now()}`,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: "mintlify",
        choices: [{ index: 0, delta: { content: chunk }, finish_reason: null }],
      };
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
    streamCompleted = true;
    console.log("✅ STREAMING WITH AUTO-CONTINUATION COMPLETED");
  } catch (error) {
    console.log("❌ STREAMING ERROR:", error.message);
  }

  // ═══ AUTOMATIC STREAMING COMPLETION CHECK ═══
  const isComplete = hasCompletionMarker(streamOutput);
  const finishReason = isComplete ? "stop" : "length";

  console.log(
    `🏷️  STREAMING COMPLETION CHECK: ${
      isComplete ? "COMPLETE" : "INCOMPLETE"
    } (${finishReason})`
  );
  if (isComplete) {
    console.log("   ✅ Found <built> marker - application complete");
  } else {
    console.log(
      "   ⚠️  No <built> marker - response may be incomplete despite auto-continuation"
    );
  }

  // Send final chunk with finish_reason
  const finalPayload = {
    id: `chatcmpl-${Date.now()}`,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: "mintlify",
    choices: [{ index: 0, delta: {}, finish_reason: finishReason }],
  };
  res.write(`data: ${JSON.stringify(finalPayload)}\n\n`);

  const outputTokens = countTokens(streamOutput);
  const duration = Date.now() - startTime;
  const tokensPerSecond =
    duration > 0 ? Math.round((outputTokens / duration) * 1000) : 0;

  console.log("\n📊 STREAMING STATISTICS:");
  console.log("   📤 OUTPUT TOKENS:", outputTokens);
  console.log("   ⏱️  DURATION:", duration + "ms");
  console.log("   ⚡ TOKENS/SEC:", tokensPerSecond);
  console.log("   🏁 STATUS:", streamCompleted ? "COMPLETED" : "TRUNCATED");
  console.log("   🏷️  FINISH REASON:", finishReason);
  console.log("   📊 TOTAL TOKENS:", inputTokens + outputTokens);
  console.log("   📝 RESPONSE LENGTH:", streamOutput.length, "characters");
  console.log("   📦 TOTAL CHUNKS:", chunkCount);

  clearInterval(heartbeat);
  console.log("✅ SENT [DONE] TO CLIENT");
  res.write("data: [DONE]\n\n");
  res.end();
});

// ─────────────────────────────────────────────────────
//   HEALTH CHECK ENDPOINT
// ─────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─────────────────────────────────────────────────────
//   START SERVER
// ─────────────────────────────────────────────────────
const port = process.env.PORT || 8000;
server.listen(port, () => {
  console.log(
    "🚀 OpenAI-compatible Mintlify proxy with automatic response continuation"
  );
  console.log("   📍 Endpoint: http://localhost:8000/v1/chat/completions");
  console.log("   🏥 Health check: http://localhost:8000/health");
  console.log("   🏷️  Completion marker: <built>");
  console.log("   🔄 Auto-continuation: ENABLED (max 15 requests)");
  console.log("   📊 Token counting: ENABLED");
  console.log("   💓 Heartbeat: 10s interval");
  console.log("   ⚡ Smart response completion: ACTIVE");
  console.log("");
});
