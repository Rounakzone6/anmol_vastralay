const testWebhook = async () => {
  const url = 'http://localhost:3001/whatsapp/webhook';
  
  const testCases = [
    { name: 'Greeting', body: 'Hi' },
    { name: 'Store Info', body: 'What is your return policy?' },
    { name: 'Latest Collection', body: 'Show me the new collection' },
    { name: 'Order Status (Fake ID)', body: 'Where is my order 12345?' }
  ];

  for (const tc of testCases) {
    console.log(`\n--- Testing: ${tc.name} ---`);
    console.log(`User: ${tc.body}`);
    
    const params = new URLSearchParams();
    params.append('From', 'whatsapp:+910000000000');
    params.append('Body', tc.body);

    try {
      const start = Date.now();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });
      const text = await res.text();
      console.log(`Server responded with: HTTP ${res.status} (in ${Date.now() - start}ms)`);
      // Note: The actual AI response is logged in the backend terminal or sent to Twilio.
      // Since we don't have access to the Twilio SMS logs easily here, 
      // let's just wait a few seconds and check the backend logs.
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
};

testWebhook();
