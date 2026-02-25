const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function testDisease() {
    try {
        console.log("Preparing test...");
        // create a dummy image to send
        // create a dummy image to send
        const testImagePath = path.join(__dirname, 'real_test.jpg');
        // create 1x1 pixel jpg or just some text
        // fs.writeFileSync(testImagePath, 'fake image data');

        const form = new FormData();
        form.append('image', fs.createReadStream(testImagePath));

        console.log("Sending POST to http://localhost:8001/api/disease/detect...");
        const response = await axios.post('http://localhost:8001/api/disease/detect', form, {
            headers: {
                ...form.getHeaders()
            }
        });
        
        console.log("SUCCESS");
        fs.writeFileSync('disease_out.json', JSON.stringify(response.data, null, 2));
    } catch (error) {
        if(error.response) {
            console.log("RAW ERROR DATA:", error.response.data);
        } else {
            console.log("RAW ERROR:", error);
        }
    }
}

testDisease();
