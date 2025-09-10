#!/usr/bin/env node

import { encodingForModel } from "js-tiktoken";

const API_BASE = "http://localhost:8000";

function countTokens(text) {
  try {
    const encoding = encodingForModel("gpt-3.5-turbo");
    return encoding.encode(text).length;
  } catch (error) {
    return Math.ceil(text.length / 4);
  }
}

async function testAutoContinuation() {
  console.log("🚀 TESTING AUTOMATIC RESPONSE CONTINUATION");
  console.log(
    "🎯 Goal: Verify that incomplete responses are automatically continued"
  );
  console.log("═".repeat(80));

  // Check server health
  try {
    const health = await fetch(`${API_BASE}/health`);
    if (!health.ok) throw new Error("Server not responding");
    const healthData = await health.json();
    console.log(
      `✅ Server healthy (uptime: ${Math.round(healthData.uptime)}s)`
    );
  } catch (error) {
    console.log("❌ Server not running. Start with: npm start");
    process.exit(1);
  }

  const longAppRequest = `Create a complete, full-featured React todo application with the following requirements:

1. **Complete React Application Structure**:
   - Modern React with hooks (useState, useEffect, useContext)
   - Multiple components (Header, TodoList, TodoItem, AddTodo, Filter)
   - Proper file structure and organization

2. **Full Functionality**:
   - Add new todos with validation
   - Mark todos as complete/incomplete
   - Edit existing todos inline
   - Delete todos with confirmation
   - Filter todos (All, Active, Completed, Priority)
   - Search/filter by text
   - Todo priorities (Low, Medium, High)
   - Due dates with calendar picker
   - Todo categories/tags
   - Bulk operations (select all, delete completed)

3. **Advanced Features**:
   - Local storage persistence
   - Import/Export functionality (JSON)
   - Dark/Light theme toggle
   - Responsive design for mobile
   - Keyboard shortcuts
   - Drag and drop reordering
   - Todo statistics dashboard
   - Progress tracking
   - Notifications for due dates

4. **Styling & UI**:
   - Complete CSS styling with modern design
   - CSS Grid and Flexbox layouts
   - Smooth animations and transitions
   - Loading states and error handling
   - Toast notifications
   - Modal dialogs
   - Icon integration

5. **Code Quality**:
   - PropTypes or TypeScript interfaces
   - Error boundaries
   - Custom hooks for logic separation
   - Comprehensive comments
   - ESLint configuration
   - Testing setup with Jest

6. **Documentation**:
   - Complete README with setup instructions
   - API documentation for components
   - Deployment guide
   - Feature list with screenshots

Please provide the complete, production-ready application with all files, configurations, and documentation. Make this a comprehensive example that demonstrates best practices in React development.

Make sure to include every single file needed to run this application, including package.json, configuration files, and detailed implementation of all features mentioned above.`;

  console.log(
    "\n🧪 Testing auto-continuation with large application request..."
  );
  console.log("📝 Request size:", countTokens(longAppRequest), "tokens");
  console.log("⏱️  Starting request...");

  const startTime = Date.now();

  try {
    const response = await fetch(`${API_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: longAppRequest }],
        stream: false,
      }),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
      const errorText = await response.text();
      console.log(`📄 Error details: ${errorText.slice(0, 500)}...`);
      return;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const outputTokens = countTokens(content);
    const wordCount = content.split(/\s+/).length;

    console.log(`\n✅ REQUEST COMPLETED!`);
    console.log(`⏱️  Total duration: ${Math.round(duration / 1000)}s`);
    console.log(`\n📊 RESPONSE ANALYSIS:`);
    console.log(`   📤 Output tokens: ${outputTokens.toLocaleString()}`);
    console.log(`   📄 Word count: ${wordCount.toLocaleString()}`);
    console.log(`   📝 Character count: ${content.length.toLocaleString()}`);
    console.log(`   🏁 Finish reason: ${data.choices[0].finish_reason}`);
    console.log(
      `   📊 Total tokens: ${data.usage?.total_tokens.toLocaleString()}`
    );

    // Check for completion marker
    const hasBuiltMarker = content.trim().endsWith("<built>");
    console.log(`\n🏷️  COMPLETION ANALYSIS:`);
    console.log(`   ✅ Has <built> marker: ${hasBuiltMarker ? "YES" : "NO"}`);
    console.log(
      `   📋 Response completeness: ${
        hasBuiltMarker ? "COMPLETE" : "POSSIBLY INCOMPLETE"
      }`
    );

    if (hasBuiltMarker) {
      console.log(`\n🎉 SUCCESS! Auto-continuation worked correctly!`);
      console.log(
        `   💡 The response was automatically continued until completion`
      );
      console.log(
        `   📊 Final response is ${outputTokens.toLocaleString()} tokens (likely > 10k due to continuation)`
      );
    } else {
      console.log(`\n⚠️  WARNING: No <built> marker found`);
      console.log(`   💭 This might indicate the response is still incomplete`);
      console.log(`   🔧 Consider increasing MAX_CONTINUATIONS in openai.js`);
    }

    // Analyze response structure
    const lines = content.split("\n").length;
    const codeBlocks = (content.match(/```/g) || []).length / 2;
    const fileStructures = (
      content.match(/\w+\.(js|jsx|ts|tsx|css|json|md)/g) || []
    ).length;

    console.log(`\n📋 CONTENT STRUCTURE ANALYSIS:`);
    console.log(`   📏 Total lines: ${lines.toLocaleString()}`);
    console.log(`   💻 Code blocks: ${Math.floor(codeBlocks)}`);
    console.log(`   📁 File references: ${fileStructures}`);

    // Show content samples
    console.log(`\n📄 CONTENT PREVIEW (first 300 chars):`);
    console.log(`"${content.slice(0, 300)}..."`);

    console.log(`\n📄 CONTENT ENDING (last 200 chars):`);
    console.log(`"...${content.slice(-200)}"`);

    // Check if it looks like a complete React app
    const hasPackageJson = content.includes("package.json");
    const hasComponents =
      content.includes("component") || content.includes("Component");
    const hasReactImports =
      content.includes("import React") || content.includes('from "react"');
    const hasCSS = content.includes(".css") || content.includes("styles");

    console.log(`\n🔍 REACT APP COMPLETENESS CHECK:`);
    console.log(`   📦 Has package.json: ${hasPackageJson ? "YES" : "NO"}`);
    console.log(`   🧩 Has React components: ${hasComponents ? "YES" : "NO"}`);
    console.log(`   📥 Has React imports: ${hasReactImports ? "YES" : "NO"}`);
    console.log(`   🎨 Has CSS/styling: ${hasCSS ? "YES" : "NO"}`);

    const completenessScore = [
      hasPackageJson,
      hasComponents,
      hasReactImports,
      hasCSS,
      hasBuiltMarker,
    ].filter(Boolean).length;

    console.log(`\n📊 COMPLETENESS SCORE: ${completenessScore}/5`);

    if (completenessScore >= 4) {
      console.log(
        `🎯 EXCELLENT! The auto-continuation system delivered a complete application!`
      );
    } else if (completenessScore >= 3) {
      console.log(
        `👍 GOOD! Most components are present, minor incompleteness possible.`
      );
    } else {
      console.log(
        `⚠️  NEEDS IMPROVEMENT: Response appears incomplete despite auto-continuation.`
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(
      `❌ Request failed after ${Math.round(duration / 1000)}s: ${
        error.message
      }`
    );
  }

  console.log(`\n🏁 AUTO-CONTINUATION TEST COMPLETED!`);
  console.log(
    `💡 Check server logs to see the continuation process in action.`
  );
}

async function testStreamingContinuation() {
  console.log("\n\n🌊 TESTING STREAMING AUTO-CONTINUATION");
  console.log("═".repeat(80));

  const simpleAppRequest = `Create a complete React calculator application with:
1. Basic arithmetic operations (+, -, *, /)
2. Clear and delete functions
3. Memory operations (M+, M-, MR, MC)
4. Scientific functions (sin, cos, tan, log, sqrt)
5. History of calculations
6. Keyboard support
7. Responsive design
8. Complete CSS styling
9. Error handling
10. Unit tests

Provide all files needed including package.json, components, styles, and documentation.`;

  console.log("📡 Starting streaming request...");
  const startTime = Date.now();

  try {
    const response = await fetch(`${API_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: simpleAppRequest }],
        stream: true,
      }),
    });

    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let totalContent = "";
    let chunkCount = 0;
    let finishReason = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ") && !line.includes("[DONE]")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.choices?.[0]?.delta?.content) {
              totalContent += data.choices[0].delta.content;
              chunkCount++;
            }
            if (data.choices?.[0]?.finish_reason) {
              finishReason = data.choices[0].finish_reason;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }

    const duration = Date.now() - startTime;
    const outputTokens = countTokens(totalContent);
    const wordCount = totalContent.split(/\s+/).length;
    const hasBuiltMarker = totalContent.trim().endsWith("<built>");

    console.log(`\n✅ STREAMING COMPLETED!`);
    console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
    console.log(`📊 Output tokens: ${outputTokens.toLocaleString()}`);
    console.log(`📄 Word count: ${wordCount.toLocaleString()}`);
    console.log(`📦 Chunks received: ${chunkCount.toLocaleString()}`);
    console.log(`🏁 Finish reason: ${finishReason}`);
    console.log(`🏷️  Has <built> marker: ${hasBuiltMarker ? "YES" : "NO"}`);

    if (hasBuiltMarker && outputTokens > 8000) {
      console.log(`\n🎉 STREAMING AUTO-CONTINUATION SUCCESS!`);
      console.log(
        `   💡 Delivered complete response > 8K tokens with proper completion`
      );
    }
  } catch (error) {
    console.log(`❌ Streaming test failed: ${error.message}`);
  }
}

// Run both tests
async function runAllTests() {
  await testAutoContinuation();
  await testStreamingContinuation();

  console.log("\n\n🏆 ALL AUTO-CONTINUATION TESTS COMPLETED!");
  console.log("💡 Review the server logs to see detailed continuation process");
}

runAllTests().catch(console.error);
