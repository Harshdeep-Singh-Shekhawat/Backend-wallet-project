async function test() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNTVmZDg4OC1mNjViLTRiNDktOThhZS1kYTdhZWM5NGU5NjMiLCJpYXQiOjE3ODIyNDA4NDV9.-dfnlvf9d20Zhk1ILC9ScHP3_3RX5-axsYW25BBA2CQ';
  
  try {
    console.log("Testing POST /api/admin/assets/upsert...");
    const res = await fetch('https://clinquant-medovik-ad2ef1.netlify.app/api/admin/assets/upsert', {
      method: 'POST',
      headers: { 
        'Cookie': `token=${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        symbol: 'TEST1',
        name: 'Test Coin 1',
        type: 'CRYPTO',
        status: 'ACTIVE',
        availableSupply: 100
      })
    });
    
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
    
  } catch(e) {
    console.error(e);
  }
}
test();
