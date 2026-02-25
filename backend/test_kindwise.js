const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testKindwise() {
  try {
    const fileBuffer = fs.readFileSync(path.join(__dirname, 'real_test.jpg'));
    const base64Image = fileBuffer.toString('base64');
    const dataUri = `data:image/jpg;base64,${base64Image}`;

    const data = {
      images: [dataUri],
      similar_images: true
    };

    console.log("Sending...");
    
    const response = await axios.post(
      'https://crop.kindwise.com/api/v1/identification?details=common_names,description,symptoms,treatment,prevention,cause',
      data,
      {
        headers: {
          'Api-Key': 'MWA5kRCWPXjkZ9XHTR0tqMFOXsAC1C6QxVLctvQX98aiJos41h',
          'Content-Type': 'application/json'
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );
    
    console.log('Success:', response.status);
    console.log('Result Keys:', Object.keys(response.data.result));
    if (response.data.result.classification) {
        console.log('Has Classification');
    }
    if (response.data.result.disease) {
        console.log('Has Disease');
    }
  } catch (error) {
    if (error.response) {
      console.log('Kindwise rejected:', error.response.status);
      console.log(error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testKindwise();
