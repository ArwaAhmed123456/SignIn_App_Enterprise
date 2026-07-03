async function testContactEmail() {
    try {
        console.log('Testing Contact Email Route...');
        const response = await fetch('http://localhost:5000/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'testuser@example.com',
                query: 'This is a test query from the verification script.'
            })
        });

        const data = await response.json();

        if (response.status === 200) {
            console.log('✅ Success: Email sent successfully!');
            console.log('Response:', data);
        } else {
            console.error('❌ Failed: Unexpected status code', response.status);
            console.error('Error:', data);
        }
    } catch (error) {
        console.error('❌ Error testing route:', error.message);
    }
}

testContactEmail();
