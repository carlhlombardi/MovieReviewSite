const handleSubmit = async (e) => {
  e.preventDefault();
  setError(''); // Clear any existing error

  try {
    const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    // Check if the response is JSON
    const contentType = response.headers.get('Content-Type');
    if (!response.ok || !contentType || !contentType.includes('application/json')) {
      const errorText = await response.text(); // Read response as text if not JSON
      throw new Error(`Unexpected response format: ${errorText}`);
    }

    // Parse the response data
    const data = await response.json();
    const { token } = data;

    if (token) {
      localStorage.setItem('token', token);
      router.push('/profile'); // Use relative path
    } else {
      throw new Error('Token not found in response');
    }
  } catch (err) {
    setError(err.message); // Set error message for display
  }
};
