let accessToken = localStorage.getItem("accessToken");
let refreshToken = localStorage.getItem("refreshToken");

async function refreshAccessToken() {
  try {
    const response = await fetch("http://localhost:5000/api/refresh-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    return accessToken;
  } catch (error) {
    console.error("Error refreshing token:", error);
    logout();
    throw error;
  }
}

async function handleLogin(email, password) {
  try {
    console.log("Attempting login for email:", email);
    const response = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Login failed");
    }

    const data = await response.json();
    console.log("Server response:", data);

    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("userInfo", JSON.stringify(data.user));
    console.log("Login successful, tokens and user info stored");

    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

async function fetchWithToken(url, options = {}) {
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    let response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      // Token might be expired, try to refresh it
      const newAccessToken = await refreshAccessToken();
      headers.Authorization = `Bearer ${newAccessToken}`;
      response = await fetch(url, { ...options, headers });
    }

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return response;
  } catch (error) {
    console.error("Error in fetchWithToken:", error);
    throw error;
  }
}

function isLoggedIn() {
  return accessToken !== null && refreshToken !== null;
}

function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userInfo");
  accessToken = null;
  refreshToken = null;
}

async function fetchUserProfile() {
  try {
    const response = await fetchWithToken(
      "http://localhost:5000/api/user-profile"
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch user profile");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
}

// Export functions for use in other files
window.handleLogin = handleLogin;
window.logout = logout;
window.isLoggedIn = isLoggedIn;
window.fetchUserProfile = fetchUserProfile;
