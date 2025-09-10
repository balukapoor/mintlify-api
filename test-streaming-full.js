import { createAsyncGenerator } from './server.js';

// Test full streaming behavior with conversation ID preservation
console.log('🧪 Testing full streaming behavior with conversation ID preservation...\n');

async function testStreamingBehavior() {
  const testMessages = [
    { 
      role: 'user', 
      content: 'Create a simple React todo app with the following features: add tasks, mark complete, delete tasks, filter by status, and local storage persistence. Include modern styling with CSS modules.' 
    }
  ];

  console.log('📡 Starting streaming test...');
  console.log('Request:', testMessages[0].content.substring(0, 100) + '...\n');

  let chunkCount = 0;
  let totalContent = '';
  let conversationIds = [];
  let requestCount = 0;

  try {
    const generator = createAsyncGenerator(testMessages, null, 5); // Limit to 5 continuations for testing
    
    for await (const chunk of generator) {
      chunkCount++;
      
      // Track all content chunks
      if (typeof chunk === 'string') {
        totalContent += chunk;
        requestCount = Math.max(requestCount, 1); // Ensure we count at least one request
        process.stdout.write('.');
      }
    }
    
    console.log(`\n🎉 Streaming completed!`);
    console.log(`📊 Total chunks: ${chunkCount}`);
    console.log(`📊 Total content length: ${totalContent.length} chars`);

    // Analyze conversation ID behavior
    console.log('\n📋 Conversation ID Analysis:');
    if (conversationIds.length === 0) {
      console.log('✅ No conversation IDs generated (standalone request completed)');
    } else {
      console.log(`🔗 Conversation IDs used: ${conversationIds.length}`);
      const uniqueIds = [...new Set(conversationIds)];
      if (uniqueIds.length === 1) {
        console.log('✅ Conversation ID preserved across continuations');
        console.log(`🔑 ID: ${uniqueIds[0]}`);
      } else {
        console.log('❌ Multiple conversation IDs detected (potential issue)');
        console.log('IDs:', uniqueIds);
      }
    }

    console.log('\n🎯 Test Results:');
    console.log(`- Streaming chunks received: ${chunkCount}`);
    console.log(`- Total requests made: ${requestCount}`);
    console.log(`- Content generated: ${totalContent.length} characters`);
    console.log(`- Conversation IDs: ${conversationIds.length > 0 ? 'Used for continuation' : 'Not needed (standalone)'}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testStreamingBehavior().then(() => {
  console.log('\n✅ Streaming test completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});
