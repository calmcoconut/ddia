// db.js
// Handles active username context and page login overlay.

(function() {
    document.addEventListener("DOMContentLoaded", () => {
        const loginOverlay = document.getElementById("loginOverlay");
        const usernameInput = document.getElementById("usernameInput");
        const continueBtn = document.getElementById("continueBtn");
        
        if (loginOverlay && usernameInput && continueBtn) {
            // Check if user is already logged in
            const activeUser = localStorage.getItem("ddia_active_user");
            if (activeUser) {
                loginOverlay.style.display = "none";
            } else {
                loginOverlay.style.display = "flex";
            }
            
            // Populate username suggestions
            try {
                const suggestions = JSON.parse(localStorage.getItem("ddia_users") || "[]");
                const datalist = document.getElementById("usernameSuggestions");
                if (datalist) {
                    datalist.innerHTML = suggestions.map(u => `<option value="${u}">`).join("");
                }
            } catch (e) {}

            const handleLogin = () => {
                const username = usernameInput.value.trim().toLowerCase();
                if (!username) {
                    alert("Please enter a username.");
                    return;
                }
                localStorage.setItem("ddia_active_user", username);
                
                // Add to suggestions list
                try {
                    let suggestions = JSON.parse(localStorage.getItem("ddia_users") || "[]");
                    if (!suggestions.includes(username)) {
                        suggestions.push(username);
                        localStorage.setItem("ddia_users", JSON.stringify(suggestions));
                    }
                } catch (e) {}
                
                loginOverlay.style.display = "none";
                window.location.reload();
            };

            continueBtn.addEventListener("click", handleLogin);
            usernameInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") handleLogin();
            });
        }
    });
})();

function getCurrentUsername() {
    try {
        return localStorage.getItem("ddia_active_user") || "anonymous";
    } catch (e) {
        return "anonymous";
    }
}
