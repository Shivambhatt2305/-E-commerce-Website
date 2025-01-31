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

async function handleSignup(full_name, email, password) {
  try {
    const response = await fetch("http://localhost:5000/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ full_name, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Signup failed");
    }

    const data = await response.json();
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("userInfo", JSON.stringify(data.user));
    return data;
  } catch (error) {
    console.error("Signup error:", error);
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

    window.location.href = "./pages/dashboard.html";

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
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      const data = await response.json();
      if (data.code === "TOKEN_EXPIRED") {
        const newAccessToken = await refreshAccessToken();
        headers["Authorization"] = `Bearer ${newAccessToken}`;
        return fetch(url, { ...options, headers });
      }
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
  updateAuthButtons();
  window.location.href = "../index.html";
}

function updateAuthButtons() {
  const authButtons = document.getElementById("auth-buttons");
  const profileButton = document.getElementById("profile-button");
  const logoutButton = document.getElementById("logout-button");

  if (authButtons && profileButton && logoutButton) {
    if (isLoggedIn()) {
      authButtons.style.display = "none";
      profileButton.style.display = "inline-block";
      logoutButton.style.display = "inline-block";
    } else {
      authButtons.style.display = "block";
      profileButton.style.display = "none";
      logoutButton.style.display = "none";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateAuthButtons();
});

// Example of using fetchWithToken
async function fetchUserProfile() {
  try {
    const response = await fetchWithToken(
      "http://localhost:5000/api/user-profile"
    );
    if (!response.ok) {
      throw new Error("Failed to fetch user profile");
    }
    const profileData = await response.json();
    console.log("User profile:", profileData);
    // Update UI with profile data
  } catch (error) {
    console.error("Error fetching user profile:", error);
    // Handle error (e.g., show error message to user)
  }
}

// Export functions for use in other files
window.handleSignup = handleSignup;
window.handleLogin = handleLogin;
window.logout = logout;
window.isLoggedIn = isLoggedIn;
window.fetchUserProfile = fetchUserProfile;
