import axios from "axios";
import fs from "fs";

// Configuration
const API_URL = "http://localhost:8000/v1/chat/completions";
const TEST_TIMEOUT = 300000; // 5 minutes

// Large application request designed to trigger multiple continuations
const LARGE_APP_REQUEST = {
  model: "gpt-4",
  messages: [
    {
      role: "user",
      content: `Create a complete full-stack e-commerce application with the following requirements:

1. Frontend (React with TypeScript):
   - Modern responsive design with Tailwind CSS
   - Product catalog with search, filtering, and pagination
   - Shopping cart with add/remove/update quantity
   - User authentication (login/register/logout)
   - User profile management
   - Order history and tracking
   - Checkout process with payment integration
   - Product reviews and ratings
   - Wishlist functionality
   - Admin dashboard for product management
   - Real-time notifications
   - Dark/light theme toggle
   - Mobile-first responsive design
   - SEO optimization
   - Performance optimization with lazy loading

2. Backend (Node.js with Express):
   - RESTful API with proper error handling
   - JWT authentication and authorization
   - User management (CRUD operations)
   - Product management (CRUD operations)
   - Order management system
   - Payment processing integration (Stripe)
   - Email notifications
   - File upload for product images
   - Database integration (MongoDB with Mongoose)
   - Input validation and sanitization
   - Rate limiting and security middleware
   - Logging and monitoring
   - API documentation with Swagger
   - Unit and integration tests

3. Database Schema:
   - Users collection with roles and permissions
   - Products collection with categories and inventory
   - Orders collection with order items
   - Reviews collection
   - Shopping carts collection
   - Wishlists collection
   - Categories collection
   - Proper indexing for performance

4. Additional Features:
   - Real-time chat support
   - Inventory management
   - Discount codes and promotions
   - Analytics dashboard
   - Email marketing integration
   - Social media login
   - Multi-language support
   - Currency conversion
   - Shipping calculator
   - Tax calculation
   - Return and refund management

Please provide:
- Complete file structure
- All source code files with detailed implementation
- Package.json files with all dependencies
- Environment configuration
- Database setup scripts
- Deployment instructions
- API documentation
- Testing setup
- Security best practices implementation
- Performance optimization techniques

Make sure to include comprehensive error handling, input validation, and follow modern development best practices. The application should be production-ready with proper logging, monitoring, and security measures.`,
    },
  ],
  stream: true,
  max_tokens: 50000,
};

// Test function to verify continuation system
async function testContinuationSystem() {
  console.log("🚀 Starting Continuation System Test");
  console.log("=".repeat(50));

  const startTime = Date.now();
  let totalContent = "";
  let chunkCount = 0;
  let continuationCount = 0;
  let lastChunkTime = startTime;

  try {
    console.log("📡 Making request to:", API_URL);
    console.log(
      "📝 Request payload size:",
      JSON.stringify(LARGE_APP_REQUEST).length,
      "characters"
    );

    const response = await axios({
      method: "POST",
      url: API_URL,
      data: LARGE_APP_REQUEST,
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      responseType: "stream",
      timeout: TEST_TIMEOUT,
    });

    console.log("✅ Connection established, receiving stream...");
    console.log("");

    return new Promise((resolve, reject) => {
      let buffer = "";
      let requestCount = 0;

      response.data.on("data", (chunk) => {
        const now = Date.now();
        const timeSinceLastChunk = now - lastChunkTime;
        lastChunkTime = now;

        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              console.log("\n🏁 Stream completed");
              resolve();
              return;
            }

            try {
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

                // Log progress every 100 chunks or if there's a significant delay
                if (chunkCount % 100 === 0 || timeSinceLastChunk > 5000) {
                  console.log(
                    `📊 Chunk ${chunkCount}: +${content.length} chars (total: ${totalContent.length} chars, delay: ${timeSinceLastChunk}ms)`
                  );
                }

                // Detect potential continuation points
                if (timeSinceLastChunk > 3000) {
                  requestCount++;
                  console.log(
                    `\n🔄 Potential continuation detected (request ${requestCount}) after ${timeSinceLastChunk}ms delay`
                  );
                  console.log(
                    `📝 Content at continuation point: "...${totalContent.slice(
                      -100
                    )}"`
                  );
                  console.log("");
                }
              }
            } catch (e) {
              // Ignore JSON parse errors for non-JSON lines
            }
          }
        }
      });

      response.data.on("end", () => {
        console.log("\n✅ Stream ended successfully");
        resolve();
      });

      response.data.on("error", (error) => {
        console.error("❌ Stream error:", error.message);
        reject(error);
      });

      // Timeout handler
      setTimeout(() => {
        console.log("⏰ Test timeout reached");
        resolve();
      }, TEST_TIMEOUT);
    });
  } catch (error) {
    console.error("❌ Request failed:", error.message);
    if (error.response) {
      console.error("📄 Response status:", error.response.status);
      console.error("📄 Response data:", error.response.data);
    }
    throw error;
  } finally {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log("\n" + "=".repeat(50));
    console.log("📊 TEST RESULTS");
    console.log("=".repeat(50));
    console.log(
      `⏱️  Total duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`
    );
    console.log(`📝 Total content length: ${totalContent.length} characters`);
    console.log(`📦 Total chunks received: ${chunkCount}`);
    console.log(
      `🔄 Estimated continuations: ${Math.max(
        0,
        Math.floor(totalContent.length / 45000)
      )}`
    );

    // Analyze content for continuation markers
    const builtMarkers = (totalContent.match(/<built>/g) || []).length;
    console.log(`🎯 <built> markers found: ${builtMarkers}`);

    // Check for signs of successful continuation
    const hasMultipleSections =
      totalContent.includes("Frontend") &&
      totalContent.includes("Backend") &&
      totalContent.includes("Database");
    const hasCodeBlocks = (totalContent.match(/```/g) || []).length;
    const avgCharsPerSecond = totalContent.length / (duration / 1000);

    console.log(`📋 Content analysis:`);
    console.log(`   - Multiple sections: ${hasMultipleSections ? "✅" : "❌"}`);
    console.log(
      `   - Code blocks: ${hasCodeBlocks / 2} (${hasCodeBlocks} markers)`
    );
    console.log(`   - Avg chars/sec: ${avgCharsPerSecond.toFixed(2)}`);

    // Success criteria
    const isSuccessful =
      totalContent.length > 90000 && builtMarkers > 0 && hasMultipleSections;
    console.log(
      `\n🎯 Test Result: ${
        isSuccessful ? "✅ SUCCESS" : "❌ NEEDS IMPROVEMENT"
      }`
    );

    if (isSuccessful) {
      console.log("✅ Continuation system appears to be working correctly!");
      console.log(
        "✅ Generated substantial content with proper completion markers"
      );
    } else {
      console.log("⚠️  Continuation system may need further optimization");
      if (totalContent.length < 90000)
        console.log("   - Content length below expected threshold");
      if (builtMarkers === 0) console.log("   - No completion markers found");
      if (!hasMultipleSections)
        console.log("   - Missing expected content sections");
    }

    // Save output for analysis
    const outputFile = `test-output-${Date.now()}.txt`;
    fs.writeFileSync(outputFile, totalContent);
    console.log(`\n💾 Full output saved to: ${outputFile}`);
  }
}

// Health check function
async function checkServerHealth() {
  try {
    console.log("🏥 Checking server health...");
    const response = await axios.get("http://localhost:8000/health", {
      timeout: 5000,
    });
    console.log("✅ Server is healthy:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Server health check failed:", error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log("🧪 Continuation System Test Suite");
  console.log("==================================\n");

  // Check if server is running
  const isHealthy = await checkServerHealth();
  if (!isHealthy) {
    console.log("\n❌ Server is not running. Please start the server first:");
    console.log("   npm start");
    process.exit(1);
  }

  console.log("\n🚀 Starting comprehensive continuation test...");
  console.log(
    "This test will request a large application to trigger multiple continuations.\n"
  );

  try {
    await testContinuationSystem();
    console.log("\n🎉 Test completed successfully!");
  } catch (error) {
    console.error("\n💥 Test failed:", error.message);
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);

export { testContinuationSystem, checkServerHealth };
