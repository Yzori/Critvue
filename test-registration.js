// Test script to simulate frontend registration request
const axios = require('axios');

async function testRegistration() {
  const credentials = {
    email: "testfrontend@example.com",
    password: "TestPass123!",
    full_name: "Test Frontend User"
  };

  console.log('Sending registration request with payload:');
  console.log(JSON.stringify(credentials, null, 2));
  console.log('\nRequest URL: http://localhost:8000/api/v1/auth/register');
  console.log('Content-Type: application/json');

  try {
    const response = await axios.post(
      'http://localhost:8000/api/v1/auth/register',
      credentials,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✓ Registration successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('\n✗ Registration failed!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

testRegistration();
