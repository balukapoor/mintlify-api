import axios from "axios";

const API_BASE = "http://localhost:8000";

async function testEmptyResponse() {
  console.log("🧪 Testing empty response issue...");

  try {
    // Test with streaming request that matches the problematic scenario
    const response = await axios.post(
      `${API_BASE}/v1/chat/completions`,
      {
        messages: [
          {
            role: "system",
            content:
              "You are GenVibe, an expert AI assistant and exceptional full-stack developer.",
          },
          {
            role: "user",
            content: "Create a simple React component",
          },
          {
            role: "assistant",
            content:
              "I'll create a modern food delivery mobile app with React Native. Let me build a complete application.",
          },
          {
            role: "user",
            content:
              "Please change bottom bar icons to be more suitable for food delivery app",
          },
        ],
        stream: true,
      },
      {
        responseType: "stream",
        timeout: 30000,
      }
    );

    let totalContent = "";
    let chunkCount = 0;
    let hasStarted = false;

    return new Promise((resolve, reject) => {
      response.data.on("data", (chunk) => {
        hasStarted = true;
        const lines = chunk.toString().split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const data = line.slice(6);
              if (data.trim() === "") continue;

              const parsed = JSON.parse(data);
              if (
                parsed.choices &&
                parsed.choices[0] &&
                parsed.choices[0].delta &&
                parsed.choices[0].delta.content
              ) {
                const content = parsed.choices[0].delta.content;
                totalContent += content;
                chunkCount++;
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
      });

      response.data.on("end", () => {
        console.log(`✅ Test completed`);
        console.log(`📊 Total content length: ${totalContent.length}`);
        console.log(`📦 Total chunks: ${chunkCount}`);
        console.log(`🚀 Stream started: ${hasStarted}`);

        if (totalContent.length === 0) {
          console.log("❌ REPRODUCED: Empty response issue!");
        } else {
          console.log("✅ Response received successfully");
          console.log(`📄 Content preview: ${totalContent.slice(0, 200)}...`);
        }
        resolve();
      });

      response.data.on("error", (error) => {
        console.error("❌ Stream error:", error.message);
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        console.log("⏰ Test timeout - checking results...");
        console.log(`📊 Total content length: ${totalContent.length}`);
        console.log(`📦 Total chunks: ${chunkCount}`);
        resolve();
      }, 30000);
    });
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("📄 Response status:", error.response.status);
      console.error("📄 Response data:", error.response.data);
    }
  }
}

// Run the test
testEmptyResponse()
  .then(() => {
    console.log("🏁 Test finished");
  })
  .catch((error) => {
    console.error("💥 Test crashed:", error.message);
  });
