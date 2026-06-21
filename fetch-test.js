fetch('https://wallet-app-backend.netlify.app/api/health')
  .then(r => r.text())
  .then(t => console.log('Response:', t))
  .catch(console.error);
