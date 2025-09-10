// Test streaming UI connection state tracking
import { buildPayload } from './server.js';

async function testStreamingUIConnection() {
  console.log('🧪 Testing streaming UI connection state...\n');
  
  const userMessages = [
    { role: 'user', content: 'Create a simple React component that displays "Hello World"' }
  ];

  try {
    // Test first request (should work)
    console.log('📡 First streaming request...');
    const firstResponse = await fetch('http://localhost:8000/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(userMessages))
    });

    if (!firstResponse.ok) {
      throw new Error(`First request failed: ${firstResponse.status}`);
    }

    let firstChunkCount = 0;
    let firstContent = '';
    const firstReader = firstResponse.body.getReader();
    
    while (true) {
      const { done, value } = await firstReader.read();
      if (done) break;
      
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.choices?.[0]?.delta?.content) {
              firstContent += data.choices[0].delta.content;
              firstChunkCount++;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    console.log(`✅ First request: ${firstChunkCount} chunks, ${firstContent.length} characters`);

    // Wait a moment to simulate UI state
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test second request (this is where the UI streaming issue occurs)
    console.log('\n📡 Second streaming request (testing UI connection)...');
    const secondResponse = await fetch('http://localhost:8000/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload([
        { role: 'user', content: 'Create a simple Vue component that displays "Hello Vue"' }
      ]))
    });

    if (!secondResponse.ok) {
      throw new Error(`Second request failed: ${secondResponse.status}`);
    }

    let secondChunkCount = 0;
    let secondContent = '';
    const secondReader = secondResponse.body.getReader();
    
    while (true) {
      const { done, value } = await secondReader.read();
      if (done) break;
      
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.choices?.[0]?.delta?.content) {
              secondContent += data.choices[0].delta.content;
              secondChunkCount++;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    console.log(`✅ Second request: ${secondChunkCount} chunks, ${secondContent.length} characters`);

    // Analyze results
    if (secondChunkCount > 0 && secondContent.length > 0) {
      console.log('\n🎉 SUCCESS: Both requests streamed properly!');
      console.log('The UI streaming connection state fix appears to be working.');
    } else {
      console.log('\n❌ ISSUE: Second request did not stream properly');
      console.log('This indicates the UI streaming connection state issue persists.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testStreamingUIConnection();
