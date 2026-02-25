const fs = require('fs');
const axios = require('axios');

async function downloadImage() {
  const response = await axios({
    url: 'https://picsum.photos/600/600',
    method: 'GET',
    responseType: 'arraybuffer'
  });
  
  fs.writeFileSync('real_test.jpg', response.data);
  console.log("Downloaded real image successfully.");
}

downloadImage();
