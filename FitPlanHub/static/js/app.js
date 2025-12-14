// ===== GLOBAL VARIABLES =====
let currentUser = null;
let currentToken = null;
let currentPage = 'home';

// ===== UTILITY FUNCTIONS =====

// Show notification
function showNotification(type, message) {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} fa-lg"></i>
        <span>${message}</span>
        <button class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Update navigation based on auth state
function updateNavigation() {
    const navLinks = document.getElementById('nav-links');
    
    if (currentUser) {
        navLinks.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" onclick="showPage('feed')">
                    <i class="fas fa-home me-1"></i> Feed
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" onclick="showPage('plans')">
                    <i class="fas fa-list me-1"></i> Plans
                </a>
            </li>
            ${currentUser.role === 'trainer' ? `
            <li class="nav-item">
                <a class="nav-link" onclick="showPage('trainer-dashboard')">
                    <i class="fas fa-chart-line me-1"></i> Dashboard
                </a>
            </li>
            ` : ''}
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                    <i class="fas fa-user-circle me-1"></i> ${currentUser.username}
                    ${currentUser.role === 'trainer' ? '<span class="badge badge-trainer ms-1">Trainer</span>' : ''}
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" onclick="showPage('profile')"><i class="fas fa-user me-2"></i>Profile</a></li>
                    <li><a class="dropdown-item" onclick="showPage('subscriptions')"><i class="fas fa-star me-2"></i>Subscriptions</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                </ul>
            </li>
        `;
    } else {
        navLinks.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" onclick="showPage('plans')">
                    <i class="fas fa-dumbbell me-1"></i> Browse Plans
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" onclick="showAuthModal('login')">
                    <i class="fas fa-sign-in-alt me-1"></i> Login
                </a>
            </li>
            <li class="nav-item">
                <a class="btn btn-primary btn-sm ms-2" onclick="showAuthModal('register')">
                    <i class="fas fa-user-plus me-1"></i> Join Free
                </a>
            </li>
        `;
    }
}

// Show authentication modal
function showAuthModal(type) {
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="authModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${type === 'login' ? 'Login to FitPlanHub' : 'Join FitPlanHub'}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${type === 'login' ? getLoginForm() : getRegisterForm()}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('authModal'));
    modal.show();
    
    // Remove modal when hidden
    document.getElementById('authModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

function getLoginForm() {
    return `
        <form onsubmit="handleLogin(event)">
            <div class="mb-3">
                <label class="form-label">Username</label>
                <input type="text" class="form-control" name="username" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Password</label>
                <input type="password" class="form-control" name="password" required>
            </div>
            <button type="submit" class="btn btn-primary w-100">Login</button>
            <div class="text-center mt-3">
                <small class="text-muted">Don't have an account? 
                    <a href="#" onclick="showAuthModal('register')" class="text-primary">Register here</a>
                </small>
            </div>
        </form>
    `;
}

function getRegisterForm() {
    return `
        <form onsubmit="handleRegister(event)">
            <div class="mb-3">
                <label class="form-label">Username</label>
                <input type="text" class="form-control" name="username" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" name="email" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Password</label>
                <input type="password" class="form-control" name="password" required minlength="6">
            </div>
            <div class="mb-3">
                <label class="form-label">Confirm Password</label>
                <input type="password" class="form-control" name="password2" required minlength="6">
            </div>
            <div class="mb-3">
                <label class="form-label">I want to join as:</label>
                <div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="role" value="user" checked>
                        <label class="form-check-label">User</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="role" value="trainer">
                        <label class="form-check-label">Trainer</label>
                    </div>
                </div>
            </div>
            <button type="submit" class="btn btn-primary w-100">Create Account</button>
            <div class="text-center mt-3">
                <small class="text-muted">Already have an account? 
                    <a href="#" onclick="showAuthModal('login')" class="text-primary">Login here</a>
                </small>
            </div>
        </form>
    `;
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch('/api/accounts/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            currentToken = result.access;
            currentUser = result.user;
            
            // Save to localStorage
            localStorage.setItem('token', currentToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            // Close modal and update UI
            bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
            updateNavigation();
            showPage('feed');
            showNotification('success', 'Successfully logged in!');
        } else {
            showNotification('error', result.error || 'Login failed');
        }
    } catch (error) {
        showNotification('error', 'Network error. Please try again.');
    }
}

// Handle registration
async function handleRegister(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    // Validate passwords match
    if (data.password !== data.password2) {
        showNotification('error', 'Passwords do not match');
        return;
    }
    
    try {
        const response = await fetch('/api/accounts/register/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: data.username,
                email: data.email,
                password: data.password,
                role: data.role
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            currentToken = result.access;
            currentUser = result.user;
            
            // Save to localStorage
            localStorage.setItem('token', currentToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            // Close modal and update UI
            bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
            updateNavigation();
            showPage('feed');
            showNotification('success', 'Account created successfully!');
        } else {
            const errorMsg = Object.values(result).flat().join(', ');
            showNotification('error', errorMsg || 'Registration failed');
        }
    } catch (error) {
        showNotification('error', 'Network error. Please try again.');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentToken = null;
    currentUser = null;
    updateNavigation();
    showPage('home');
    showNotification('info', 'Successfully logged out');
}

// ===== PAGE FUNCTIONS =====

// Main function to show pages
function showPage(pageName) {
    currentPage = pageName;
    const container = document.getElementById('app-container');
    
    switch(pageName) {
        case 'home':
            container.innerHTML = getHomePage();
            loadHomePlans();
            break;
        case 'feed':
            if (!currentUser) {
                showAuthModal('login');
                return;
            }
            container.innerHTML = getFeedPage();
            loadFeed();
            break;
        case 'plans':
            container.innerHTML = getPlansPage();
            loadPlans();
            break;
        case 'profile':
            if (!currentUser) {
                showAuthModal('login');
                return;
            }
            container.innerHTML = getProfilePage();
            break;
        case 'subscriptions':
            if (!currentUser) {
                showAuthModal('login');
                return;
            }
            container.innerHTML = getSubscriptionsPage();
            loadSubscriptions();
            break;
        case 'trainer-dashboard':
            if (!currentUser || currentUser.role !== 'trainer') {
                showNotification('error', 'Only trainers can access dashboard');
                showPage('home');
                return;
            }
            container.innerHTML = getTrainerDashboard();
            loadTrainerDashboard();
            break;
        default:
            container.innerHTML = getHomePage();
    }
}

// ===== PAGE TEMPLATES =====

function getHomePage() {
    return `
        <div class="hero-section">
            <h1 class="hero-title">Transform Your Fitness Journey</h1>
            <p class="hero-subtitle">
                Join thousands of members achieving their fitness goals with personalized plans 
                from certified trainers. Start your transformation today!
            </p>
            <div class="mt-4">
                ${!currentUser ? `
                <button class="btn btn-primary btn-lg me-3" onclick="showAuthModal('register')">
                    <i class="fas fa-rocket me-2"></i>Start Free Trial
                </button>
                <button class="btn btn-outline-light btn-lg" onclick="showPage('plans')">
                    <i class="fas fa-search me-2"></i>Browse Plans
                </button>
                ` : `
                <button class="btn btn-primary btn-lg me-3" onclick="showPage('feed')">
                    <i class="fas fa-home me-2"></i>Go to Feed
                </button>
                <button class="btn btn-outline-light btn-lg" onclick="showPage('plans')">
                    <i class="fas fa-dumbbell me-2"></i>Explore Plans
                </button>
                `}
            </div>
        </div>

        <div class="row mt-5">
            <div class="col-md-4">
                <div class="card text-center p-4">
                    <i class="fas fa-user-check fa-3x text-primary mb-3"></i>
                    <h4>Certified Trainers</h4>
                    <p class="text-muted">Get personalized plans from certified fitness professionals.</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card text-center p-4">
                    <i class="fas fa-chart-line fa-3x text-success mb-3"></i>
                    <h4>Progress Tracking</h4>
                    <p class="text-muted">Monitor your progress with detailed analytics.</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card text-center p-4">
                    <i class="fas fa-users fa-3x text-accent mb-3"></i>
                    <h4>Community Support</h4>
                    <p class="text-muted">Join a supportive community of fitness enthusiasts.</p>
                </div>
            </div>
        </div>

        <div class="mt-5">
            <h2 class="text-center mb-4">Popular Fitness Plans</h2>
            <div class="row" id="home-plans">
                <div class="col-12 text-center">
                    <div class="loading-spinner"></div>
                    <p class="mt-2">Loading plans...</p>
                </div>
            </div>
            <div class="text-center mt-4">
                <button class="btn btn-primary" onclick="showPage('plans')">
                    <i class="fas fa-list me-2"></i>View All Plans
                </button>
            </div>
        </div>
    `;
}

function getFeedPage() {
    return `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Your Fitness Feed</h2>
                <button class="btn btn-primary" onclick="loadFeed()">
                    <i class="fas fa-sync-alt me-2"></i>Refresh
                </button>
            </div>
            <div id="feed-content">
                <div class="text-center py-5">
                    <div class="loading-spinner"></div>
                    <p class="mt-2">Loading your feed...</p>
                </div>
            </div>
        </div>
    `;
}

function getPlansPage() {
    return `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Browse Fitness Plans</h2>
                ${currentUser?.role === 'trainer' ? `
                <button class="btn btn-success" onclick="showCreatePlanModal()">
                    <i class="fas fa-plus me-2"></i>Create Plan
                </button>
                ` : ''}
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6 mb-3">
                    <input type="text" class="form-control" placeholder="Search plans..." id="searchPlans" 
                           onkeyup="searchPlans()">
                </div>
                <div class="col-md-6">
                    <select class="form-control" id="sortPlans" onchange="sortPlans()">
                        <option value="newest">Newest First</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                    </select>
                </div>
            </div>
            
            <div class="row" id="plans-grid">
                <div class="col-12 text-center py-5">
                    <div class="loading-spinner"></div>
                    <p class="mt-2">Loading plans...</p>
                </div>
            </div>
        </div>
    `;
}

function getProfilePage() {
    return `
        <div>
            <div class="card mb-4">
                <div class="card-body text-center">
                    <div class="mb-3">
                        <i class="fas fa-user-circle fa-5x text-primary"></i>
                    </div>
                    <h3>${currentUser.username}</h3>
                    <p class="text-muted">${currentUser.email}</p>
                    <span class="badge ${currentUser.role === 'trainer' ? 'badge-trainer' : 'badge-primary'}">
                        ${currentUser.role === 'trainer' ? 'Certified Trainer' : 'Member'}
                    </span>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h5>Account Information</h5>
                            <p><strong>Username:</strong> ${currentUser.username}</p>
                            <p><strong>Email:</strong> ${currentUser.email}</p>
                            <p><strong>Role:</strong> ${currentUser.role}</p>
                            <p><strong>Bio:</strong> ${currentUser.bio || 'Not set'}</p>
                            <button class="btn btn-outline-primary btn-sm mt-2" onclick="showEditProfileModal()">
                                <i class="fas fa-edit me-1"></i>Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h5>Quick Actions</h5>
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary" onclick="showPage('subscriptions')">
                                    <i class="fas fa-star me-2"></i>My Subscriptions
                                </button>
                                ${currentUser.role === 'trainer' ? `
                                <button class="btn btn-success" onclick="showPage('trainer-dashboard')">
                                    <i class="fas fa-chart-line me-2"></i>Trainer Dashboard
                                </button>
                                ` : ''}
                                <button class="btn btn-outline-danger" onclick="logout()">
                                    <i class="fas fa-sign-out-alt me-2"></i>Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getSubscriptionsPage() {
    return `
        <div>
            <h2 class="mb-4">My Subscriptions</h2>
            <div id="subscriptions-content">
                <div class="text-center py-5">
                    <div class="loading-spinner"></div>
                    <p class="mt-2">Loading subscriptions...</p>
                </div>
            </div>
        </div>
    `;
}

function getTrainerDashboard() {
    return `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Trainer Dashboard</h2>
                <button class="btn btn-success" onclick="showCreatePlanModal()">
                    <i class="fas fa-plus me-2"></i>Create New Plan
                </button>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card text-center p-3">
                        <h3 class="text-primary" id="total-plans">0</h3>
                        <p class="text-muted">Total Plans</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center p-3">
                        <h3 class="text-success" id="total-subscribers">0</h3>
                        <p class="text-muted">Total Subscribers</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center p-3">
                        <h3 class="text-warning" id="total-earnings">$0</h3>
                        <p class="text-muted">Total Earnings</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center p-3">
                        <h3 class="text-accent" id="total-followers">0</h3>
                        <p class="text-muted">Followers</p>
                    </div>
                </div>
            </div>
            
            <h4 class="mb-3">My Plans</h4>
            <div id="trainer-plans">
                <div class="text-center py-5">
                    <div class="loading-spinner"></div>
                    <p class="mt-2">Loading your plans...</p>
                </div>
            </div>
        </div>
    `;
}

// ===== API FUNCTIONS =====

async function loadHomePlans() {
    try {
        const response = await fetch('/api/plans/');
        if (response.ok) {
            const plans = await response.json();
            const container = document.getElementById('home-plans');
            
            if (plans.length === 0) {
                container.innerHTML = '<p class="text-muted">No plans available yet.</p>';
                return;
            }
            
            container.innerHTML = '';
            plans.slice(0, 3).forEach(plan => {
                container.innerHTML += `
                    <div class="col-md-4 mb-4">
                        <div class="card plan-card">
                            <div class="plan-header">
                                <h5 class="mb-0">${plan.title}</h5>
                                <div class="plan-price">$${plan.price}</div>
                            </div>
                            <div class="card-body">
                                <p class="text-muted">${plan.preview_description}</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge bg-primary">${plan.duration_days} days</span>
                                    <button class="btn btn-sm btn-primary" onclick="viewPlan(${plan.id})">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
    } catch (error) {
        console.error('Error loading home plans:', error);
        document.getElementById('home-plans').innerHTML = `
            <div class="col-12 text-center">
                <p class="text-muted">Failed to load plans. Please try again later.</p>
            </div>
        `;
    }
}

async function loadPlans() {
    try {
        const headers = currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {};
        const response = await fetch('/api/plans/', { headers });
        
        if (response.ok) {
            const plans = await response.json();
            displayPlans(plans);
        }
    } catch (error) {
        console.error('Error loading plans:', error);
        document.getElementById('plans-grid').innerHTML = `
            <div class="col-12 text-center">
                <p class="text-danger">Failed to load plans. Please try again later.</p>
            </div>
        `;
    }
}

function displayPlans(plans) {
    const container = document.getElementById('plans-grid');
    
    if (!plans || plans.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-dumbbell fa-3x text-muted mb-3"></i>
                <h4>No plans found</h4>
                <p class="text-muted">Check back later for new fitness plans.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    plans.forEach(plan => {
        container.innerHTML += `
            <div class="col-md-4 mb-4">
                <div class="card plan-card">
                    <div class="plan-header">
                        <h5 class="mb-0">${plan.title}</h5>
                        <div class="plan-price">$${plan.price}</div>
                    </div>
                    <div class="card-body">
                        <p class="text-muted mb-2">
                            <i class="fas fa-user-tie me-1"></i>${plan.trainer.username}
                        </p>
                        <p>${plan.preview_description}</p>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <span class="badge bg-primary">${plan.duration_days} days</span>
                            <div>
                                ${plan.is_subscribed ? 
                                    '<span class="badge bg-success me-2">Subscribed</span>' : 
                                    `<button class="btn btn-sm btn-primary me-2" onclick="subscribeToPlan(${plan.id})">
                                        Subscribe
                                    </button>`
                                }
                                <button class="btn btn-sm btn-outline-primary" onclick="viewPlan(${plan.id})">
                                    Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

function searchPlans() {
    const searchTerm = document.getElementById('searchPlans').value.toLowerCase();
    const plans = document.querySelectorAll('#plans-grid .col-md-4');
    
    plans.forEach(plan => {
        const text = plan.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            plan.style.display = 'block';
        } else {
            plan.style.display = 'none';
        }
    });
}

function sortPlans() {
    showNotification('info', 'Sorting feature coming soon!');
}

async function loadFeed() {
    if (!currentUser) return;
    
    try {
        const response = await fetch('/api/plans/feed/', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        if (response.ok) {
            const feed = await response.json();
            displayFeed(feed);
        }
    } catch (error) {
        console.error('Error loading feed:', error);
        document.getElementById('feed-content').innerHTML = `
            <div class="text-center py-5">
                <p class="text-danger">Failed to load feed. Please try again later.</p>
            </div>
        `;
    }
}

function displayFeed(feed) {
    const container = document.getElementById('feed-content');
    
    if (!feed || feed.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-newspaper fa-3x text-muted mb-3"></i>
                <h4>Your feed is empty</h4>
                <p class="text-muted">Follow trainers and subscribe to plans to see content here.</p>
                <button class="btn btn-primary mt-2" onclick="showPage('plans')">
                    <i class="fas fa-search me-2"></i>Browse Plans
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    feed.forEach(item => {
        html += `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        <i class="fas fa-user-circle fa-2x me-3"></i>
                        <div>
                            <h5 class="mb-0">${item.trainer.username}</h5>
                            <small class="text-muted">Trainer</small>
                        </div>
                    </div>
                    <h4>${item.title}</h4>
                    <p>${item.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-primary">${item.duration_days} Days</span>
                        <span class="text-success fw-bold">$${item.price}</span>
                    </div>
                    ${item.is_subscribed ? 
                        '<span class="badge bg-success mt-3">✓ Subscribed</span>' :
                        `<button class="btn btn-sm btn-primary mt-3" onclick="subscribeToPlan(${item.id})">
                            Subscribe Now
                        </button>`
                    }
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function loadSubscriptions() {
    if (!currentUser) return;
    
    try {
        const response = await fetch('/api/plans/subscriptions/', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        if (response.ok) {
            const subscriptions = await response.json();
            displaySubscriptions(subscriptions);
        }
    } catch (error) {
        console.error('Error loading subscriptions:', error);
        document.getElementById('subscriptions-content').innerHTML = `
            <div class="text-center py-5">
                <p class="text-danger">Failed to load subscriptions. Please try again later.</p>
            </div>
        `;
    }
}

function displaySubscriptions(subscriptions) {
    const container = document.getElementById('subscriptions-content');
    
    if (!subscriptions || subscriptions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-star fa-3x text-muted mb-3"></i>
                <h4>No subscriptions yet</h4>
                <p class="text-muted">Subscribe to plans to access premium content.</p>
                <button class="btn btn-primary mt-2" onclick="showPage('plans')">
                    <i class="fas fa-search me-2"></i>Browse Plans
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '<div class="row">';
    subscriptions.forEach(sub => {
        container.innerHTML += `
            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-body">
                        <h5>${sub.plan.title}</h5>
                        <p class="text-muted">${sub.plan.description.substring(0, 100)}...</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-success fw-bold">$${sub.plan.price}</span>
                            <button class="btn btn-sm btn-outline-primary">
                                Access Plan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML += '</div>';
}

async function loadTrainerDashboard() {
    if (!currentUser || currentUser.role !== 'trainer') return;
    
    try {
        // Load stats
        const statsResponse = await fetch('/api/plans/trainer/stats/', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            document.getElementById('total-plans').textContent = stats.total_plans || 0;
            document.getElementById('total-subscribers').textContent = stats.total_subscribers || 0;
            document.getElementById('total-earnings').textContent = `$${stats.total_earnings || 0}`;
            document.getElementById('total-followers').textContent = stats.total_followers || 0;
        }
        
        // Load trainer's plans
        const plansResponse = await fetch('/api/plans/trainer/plans/', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        if (plansResponse.ok) {
            const plans = await plansResponse.json();
            displayTrainerPlans(plans);
        }
    } catch (error) {
        console.error('Error loading trainer dashboard:', error);
        document.getElementById('trainer-plans').innerHTML = `
            <div class="text-center py-5">
                <p class="text-danger">Failed to load dashboard. Please try again later.</p>
            </div>
        `;
    }
}

function displayTrainerPlans(plans) {
    const container = document.getElementById('trainer-plans');
    
    if (!plans || plans.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-dumbbell fa-3x text-muted mb-3"></i>
                <h4>No plans created yet</h4>
                <p class="text-muted">Create your first fitness plan to get started.</p>
                <button class="btn btn-success mt-2" onclick="showCreatePlanModal()">
                    <i class="fas fa-plus me-2"></i>Create First Plan
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '<div class="row">';
    plans.forEach(plan => {
        container.innerHTML += `
            <div class="col-md-4 mb-4">
                <div class="card">
                    <div class="card-body">
                        <h5>${plan.title}</h5>
                        <p class="text-muted">${plan.description.substring(0, 80)}...</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="badge bg-primary">$${plan.price}</span>
                            <div>
                                <button class="btn btn-sm btn-warning me-1" onclick="editPlan(${plan.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deletePlan(${plan.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML += '</div>';
}

// ===== ACTION FUNCTIONS =====

async function subscribeToPlan(planId) {
    if (!currentUser) {
        showAuthModal('login');
        return;
    }
    
    try {
        const response = await fetch(`/api/plans/${planId}/subscribe/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({})
        });
        
        if (response.ok) {
            showNotification('success', 'Successfully subscribed to plan!');
            // Refresh current page
            if (currentPage === 'plans') loadPlans();
            if (currentPage === 'feed') loadFeed();
        } else {
            const error = await response.json();
            showNotification('error', error.error || 'Subscription failed');
        }
    } catch (error) {
        showNotification('error', 'Network error. Please try again.');
    }
}

function viewPlan(planId) {
    showNotification('info', `Viewing plan ${planId} - Feature coming soon!`);
}

function showEditProfileModal() {
    const modalHTML = `
        <div class="modal fade" id="editProfileModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Profile</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form onsubmit="updateProfile(event)">
                            <div class="mb-3">
                                <label class="form-label">Bio</label>
                                <textarea class="form-control" name="bio" rows="3">${currentUser.bio || ''}</textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" name="email" value="${currentUser.email}" required>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Update Profile</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    modal.show();
    
    document.getElementById('editProfileModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

async function updateProfile(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch('/api/accounts/profile/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const updatedUser = await response.json();
            currentUser = updatedUser;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            bootstrap.Modal.getInstance(document.getElementById('editProfileModal')).hide();
            showNotification('success', 'Profile updated successfully!');
            showPage('profile'); // Refresh profile page
        } else {
            const error = await response.json();
            showNotification('error', error.error || 'Failed to update profile');
        }
    } catch (error) {
        showNotification('error', 'Network error. Please try again.');
    }
}

function showCreatePlanModal() {
    if (!currentUser || currentUser.role !== 'trainer') {
        showNotification('error', 'Only trainers can create plans');
        return;
    }
    
    const modalHTML = `
        <div class="modal fade" id="createPlanModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Create New Fitness Plan</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form onsubmit="createPlan(event)">
                            <div class="mb-3">
                                <label class="form-label">Plan Title</label>
                                <input type="text" class="form-control" name="title" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Full Description</label>
                                <textarea class="form-control" name="description" rows="3" required></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Preview Description</label>
                                <textarea class="form-control" name="preview_description" rows="2" required></textarea>
                                <small class="text-muted">Shown to non-subscribers</small>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Price ($)</label>
                                    <input type="number" class="form-control" name="price" step="0.01" min="0" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Duration (days)</label>
                                    <input type="number" class="form-control" name="duration_days" min="1" required>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-success w-100">Create Plan</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('createPlanModal'));
    modal.show();
    
    document.getElementById('createPlanModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

async function createPlan(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch('/api/plans/trainer/plans/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const plan = await response.json();
            bootstrap.Modal.getInstance(document.getElementById('createPlanModal')).hide();
            showNotification('success', 'Plan created successfully!');
            if (currentPage === 'trainer-dashboard') loadTrainerDashboard();
            if (currentPage === 'plans') loadPlans();
        } else {
            const error = await response.json();
            showNotification('error', error.error || 'Failed to create plan');
        }
    } catch (error) {
        showNotification('error', 'Network error. Please try again.');
    }
}

function editPlan(planId) {
    showNotification('info', `Edit plan ${planId} - Feature coming soon!`);
}

function deletePlan(planId) {
    if (confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
        showNotification('info', `Delete plan ${planId} - Feature coming soon!`);
    }
}

// ===== MAKE FUNCTIONS GLOBAL =====
window.showPage = showPage;
window.showAuthModal = showAuthModal;
window.logout = logout;
window.subscribeToPlan = subscribeToPlan;
window.showCreatePlanModal = showCreatePlanModal;
window.searchPlans = searchPlans;
window.sortPlans = sortPlans;
window.showEditProfileModal = showEditProfileModal;