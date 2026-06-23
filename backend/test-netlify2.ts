async function test() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNTVmZDg4OC1mNjViLTRiNDktOThhZS1kYTdhZWM5NGU5NjMiLCJpYXQiOjE3ODIyNDA4NDV9.-dfnlvf9d20Zhk1ILC9ScHP3_3RX5-axsYW25BBA2CQ';
  
  try {
    console.log("Checking Auth...");
    const authRes = await fetch('https://clinquant-medovik-ad2ef1.netlify.app/api/auth/me', {
      headers: { 'Cookie': `token=${token}` }
    });
    console.log(await authRes.json());
    
    console.log("Checking Assets...");
    const assetRes = await fetch('https://clinquant-medovik-ad2ef1.netlify.app/api/admin/assets', {
      headers: { 'Cookie': `token=${token}` }
    });
    console.log(await assetRes.json());
    
  } catch(e) {
    console.error(e);
  }
}
test();
