# Mintlify API Token Limit Testing & Auto-Continuation

This repository contains scripts to test the token limits and performance of your Mintlify API proxy, plus an **Automatic Response Continuation System** that eliminates the 9-10k word limitation.

## 🚀 New Feature: Automatic Response Continuation

The API proxy now automatically continues incomplete responses until full completion, ensuring you always get complete applications regardless of output token limits.

### Key Benefits:

- ✅ **No more truncated responses** - Get complete applications every time
- ✅ **Zero configuration needed** - Works transparently with existing code
- ✅ **Smart detection** - Uses `<built>` markers to detect completion
- ✅ **Context preservation** - Maintains conversation flow across continuations
- ✅ **Works with streaming** - Both streaming and non-streaming modes supported

📖 **[Read the complete Auto-Continuation Documentation](./AUTO_CONTINUATION.md)**

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the API server:**
   ```bash
   npm start
   # or
   node openai.js
   ```
   Server will run on `http://localhost:8000`

## Testing Scripts

### Quick Test (`quick-test.js`)

Fast, simple test to find basic token limits:

```bash
npm run quick-test
```

**Features:**

- Tests progressive input sizes (100, 1K, 4K, 8K, 16K tokens)
- Quick feedback on limits
- Minimal output for fast results

### Comprehensive Test (`test-token-limits.js`)

Detailed testing suite with full analysis:

```bash
npm run test-tokens
```

**Features:**

- **Input Token Tests**: Progressive testing from 100 to 32K tokens
- **Output Token Tests**: Tests response length limits
- **Streaming Tests**: Validates streaming mode with large inputs
- **Detailed Metrics**: Token counting, performance, failure analysis
- **Safety**: Automatic stopping when limits are reached

### Auto-Continuation Test

Test the new automatic response continuation system:

```bash
npm run test-continuation
```

**Features:**

- Tests automatic continuation with large application requests
- Verifies completion marker detection
- Analyzes response completeness and structure
- Tests both streaming and non-streaming modes
- Provides detailed metrics and analysis

### Health Check

```bash
npm run health
# or
curl http://localhost:8000/health
```

## Test Output Examples

### Quick Test Output:

```
🚀 Quick Token Limit Test
✅ Server is running

🧪 Small test (100 tokens)
📝 Input: 102 tokens, 612 chars
✅ Success!
   📥 Input: 102 tokens
   📤 Output: 45 tokens
   📊 Total: 147 tokens
   🏁 Finish: stop
```

### Comprehensive Test Output:

```
🧪 Large Input Test: Testing 1000 input tokens
─────────────────────────────────────────────────────────
📝 Generated text: 998 tokens (5988 chars)
✅ Success! Duration: 3245ms
📊 Token usage:
   📥 Input: 998
   📤 Output: 156
   📊 Total: 1154
📝 Response preview: Based on your test message, I can see you're testing the API with a repeated...
```

## API Endpoints Tested

- `POST /v1/chat/completions` - Main chat endpoint
- `GET /health` - Health check endpoint

## Understanding Results

### Token Limits

- **Input tokens**: How much you can send in a single request
- **Output tokens**: How much the API can respond with
- **Total tokens**: Combined input + output limit

### Performance Metrics

- **Duration**: Response time in milliseconds
- **Tokens/sec**: Processing speed
- **Finish reason**:
  - `stop` = Complete response
  - `length` = Hit token limit

### Failure Points

- Tests automatically stop when limits are reached
- Error messages indicate the specific failure type
- HTTP status codes help diagnose connection issues

## Troubleshooting

### Server Not Running

```
❌ Server not running. Start with: node openai.js
```

**Solution**: Start the server first with `npm start`

### Connection Errors

- Check if server is running on port 8000
- Verify no firewall blocking localhost connections
- Ensure no other service using port 8000

### Token Counting Issues

- Uses `js-tiktoken` for accurate GPT token counting
- Falls back to character-based estimation if tiktoken fails
- Different models may have different token limits

## Customization

### Modify Test Parameters

Edit the test arrays in `test-token-limits.js`:

```javascript
const inputTests = [
  { tokens: 100, name: "Small Input Test" },
  { tokens: 500, name: "Medium Input Test" },
  // Add your custom test sizes
];
```

### Change API Endpoint

Update `API_BASE` in both test files:

```javascript
const API_BASE = "http://your-server:port";
```

### Adjust Delays

Modify `DELAY_BETWEEN_TESTS` to change timing between tests:

```javascript
const DELAY_BETWEEN_TESTS = 5000; // 5 seconds
```

## Results Interpretation

### Expected Limits

- Most AI APIs support 4K-8K input tokens
- Output typically limited to 2K-4K tokens
- Total conversation context varies by provider

### Performance Benchmarks

- **Good**: < 2 seconds response time
- **Acceptable**: 2-5 seconds
- **Slow**: > 5 seconds

### Monitoring Production

Use these scripts to:

- Validate API performance before deployment
- Monitor token usage patterns
- Detect limit changes after updates
- Benchmark different input strategies
# mintlify-api
