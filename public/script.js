class JungleRewardsSystem {
    constructor() {
        this.API_BASE = '/api';
        this.currentClass = '4 Pearl';
        this.currentView = 'visitor';
        this.isAuthenticated = false;
        this.authToken = null;
        this.studentData = [];
        
        this.initializeApp();
    }

    async initializeApp() {
        try {
            console.log('🚀 Initializing Jungle Rewards System...');
            
            // Check for existing authentication
            const savedToken = localStorage.getItem('jungleAuthToken');
            if (savedToken) {
                this.authToken = savedToken;
                this.isAuthenticated = true;
                this.toggleAuthState(true);
            }

            await this.loadInitialData();
            this.setupEventListeners();
            this.hideLoadingScreen();
            
            this.showToast('Welcome to Jungle Rewards!', 'success');
            
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showToast('Failed to initialize app', 'error');
        }
    }

    async fetchData(endpoint, options = {}) {
        try {
            const url = `${this.API_BASE}${endpoint}`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
                },
                ...options
            };

            if (options.body) {
                config.body = JSON.stringify(options.body);
            }

            console.log(`📡 API Call: ${url}`, config);

            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ API Response:', data);
            return data;
        } catch (error) {
            console.error('❌ API request failed:', error);
            this.showToast('Network error - please check connection', 'error');
            throw error;
        }
    }

    async loadInitialData() {
        try {
            console.log('📊 Loading initial data...');
            const result = await this.fetchData(`/groups?class=${encodeURIComponent(this.currentClass)}`);
            
            if (result.success) {
                this.updateGroupsDisplay(result.data);
                this.updateLastUpdated();
                this.showToast(`Loaded ${this.currentClass} data`, 'success');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showToast('Failed to load data', 'error');
            
            // Show offline mode
            this.updateGroupsDisplay({});
        }
    }

    async verifyAdminPassword(password) {
        try {
            console.log('🔐 Verifying admin password...');
            const result = await this.fetchData('/auth/login', {
                method: 'POST',
                body: { password }
            });
            
            if (result.success) {
                this.authToken = result.token;
                this.isAuthenticated = true;
                localStorage.setItem('jungleAuthToken', result.token);
                this.toggleAuthState(true);
                this.showToast('Admin access granted!', 'success');
                this.hideModal('loginModal');
            } else {
                this.showToast('Invalid password', 'error');
            }
            
            return result;
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Login failed - check connection', 'error');
            return { success: false, error: error.message };
        }
    }

    async updateStudentPoints(studentName, pointsChange) {
        try {
            console.log(`🔄 Updating points for ${studentName}: ${pointsChange}`);
            const result = await this.fetchData('/students/points', {
                method: 'POST',
                body: {
                    studentName: studentName,
                    change: pointsChange
                }
            });

            if (result.success) {
                const action = pointsChange >= 0 ? 'added' : 'deducted';
                this.showToast(`${pointsChange} points ${action} for ${studentName}`, 'success');
                await this.loadInitialData(); // Refresh data
            } else {
                this.showToast(result.error, 'error');
            }
            
            return result;
        } catch (error) {
            console.error('Update points error:', error);
            this.showToast('Failed to update points', 'error');
            return { success: false, error: error.message };
        }
    }

    async applyGroupBonus(groupName, className) {
        try {
            console.log(`🎯 Applying group bonus to ${groupName}`);
            const result = await this.fetchData('/groups/bonus', {
                method: 'POST',
                body: {
                    groupName: groupName,
                    className: className
                }
            });

            if (result.success) {
                this.showToast(`+10 points bonus applied to ${groupName}`, 'success');
                await this.loadInitialData();
            } else {
                this.showToast(result.error, 'error');
            }
            
            return result;
        } catch (error) {
            console.error('Group bonus error:', error);
            this.showToast('Failed to apply group bonus', 'error');
            return { success: false, error: error.message };
        }
    }

    async resetAllPoints() {
        try {
            if (!confirm('Are you sure you want to reset ALL points to zero? This cannot be undone.')) {
                return;
            }

            console.log('🔄 Resetting all points...');
            const result = await this.fetchData('/students/reset', {
                method: 'POST'
            });

            if (result.success) {
                this.showToast(`Reset ${result.studentsReset} students to 0 points`, 'success');
                await this.loadInitialData();
            } else {
                this.showToast(result.error, 'error');
            }
            
            return result;
        } catch (error) {
            console.error('Reset points error:', error);
            this.showToast('Failed to reset points', 'error');
            return { success: false, error: error.message };
        }
    }

    async initializeSystemData() {
        try {
            if (!confirm('Initialize system data? This will reset all students and points.')) {
                return;
            }

            console.log('🔄 Initializing system data...');
            const result = await this.fetchData('/students/initialize', {
                method: 'POST'
            });

            if (result.success) {
                this.showToast(`System initialized with ${result.totalStudents} students`, 'success');
                await this.loadInitialData();
            } else {
                this.showToast(result.error, 'error');
            }
            
            return result;
        } catch (error) {
            console.error('Initialize data error:', error);
            this.showToast('Failed to initialize data', 'error');
            return { success: false, error: error.message };
        }
    }

    updateGroupsDisplay(groupsData) {
        const groupsGrid = document.getElementById('groupsGrid');
        
        if (!groupsGrid) {
            console.error('Groups grid element not found');
            return;
        }

        // Clear loading state
        groupsGrid.innerHTML = '';

        if (!groupsData || Object.keys(groupsData).length === 0) {
            groupsGrid.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>No Data Available</h3>
                    <p>Unable to load group data. Please check your connection.</p>
                    <button class="premium-btn" onclick="app.loadInitialData()">
                        <i class="fas fa-sync-alt"></i>
                        Retry
                    </button>
                </div>
            `;
            return;
        }

        let totalGroups = 0;
        let html = '';

        for (const [className, levels] of Object.entries(groupsData)) {
            for (const [level, groups] of Object.entries(levels)) {
                for (const [groupName, groupData] of Object.entries(groups)) {
                    totalGroups++;
                    
                    const groupPoints = groupData.totalPoints || 0;
                    const memberCount = groupData.members ? groupData.members.length : 0;
                    
                    html += `
                        <div class="group-card" data-class="${className}" data-group="${groupName}">
                            <div class="group-header">
                                <div class="group-name">${groupName}</div>
                                <div class="group-level">
                                    <i class="fas fa-layer-group"></i>
                                    ${level} • ${className}
                                </div>
                            </div>
                            
                            <div class="group-stats">
                                <div class="points-display">
                                    <div class="points-icon">
                                        <i class="fas fa-gem"></i>
                                    </div>
                                    <div class="points-info">
                                        <div class="points-value">${groupPoints}</div>
                                        <div class="points-label">Crystals</div>
                                    </div>
                                </div>
                                <div class="member-count">
                                    <i class="fas fa-users"></i>
                                    ${memberCount} members
                                </div>
                            </div>
                            
                            <div class="group-actions">
                                <button class="group-action-btn view-members" 
                                        onclick="app.showGroupMembers('${className}', '${groupName}', '${level}')">
                                    <i class="fas fa-list"></i>
                                    View Members
                                </button>
                                ${this.isAuthenticated ? `
                                <button class="group-action-btn group-bonus" 
                                        onclick="app.applyGroupBonus('${groupName}', '${className}')">
                                    <i class="fas fa-star"></i>
                                    +10 Bonus
                                </button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }
            }
        }

        groupsGrid.innerHTML = html;
        console.log(`✅ Displayed ${totalGroups} groups`);
    }

    async showGroupMembers(className, groupName, level) {
        try {
            console.log(`👥 Loading members for ${groupName}`);
            const result = await this.fetchData(`/students?class=${encodeURIComponent(className)}`);
            
            if (result.success) {
                const groupStudents = result.data.filter(student => 
                    student.group === groupName && student.class === className
                );
                
                this.displayGroupModal(className, groupName, level, groupStudents);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error loading group members:', error);
            this.showToast('Failed to load group members', 'error');
        }
    }

    displayGroupModal(className, groupName, level, students) {
        const modal = document.getElementById('groupModal');
        const modalName = document.getElementById('modalGroupName');
        const modalContent = document.getElementById('modalGroupContent');

        if (!modal || !modalName || !modalContent) {
            console.error('Modal elements not found');
            return;
        }

        modalName.innerHTML = `<i class="fas fa-users"></i> ${groupName}`;
        
        let html = `
            <div class="group-modal-header">
                <div class="group-info">
                    <div class="group-class">${className}</div>
                    <div class="group-level">${level}</div>
                </div>
                <div class="group-stats-summary">
                    <div class="stat">
                        <i class="fas fa-users"></i>
                        <span>${students.length} Members</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-gem"></i>
                        <span>${students.reduce((sum, student) => sum + (student.points || 0), 0)} Total Crystals</span>
                    </div>
                </div>
            </div>
            
            <div class="members-list">
                <h4>Group Members</h4>
        `;

        students.sort((a, b) => (b.points || 0) - (a.points || 0));
        
        students.forEach((student, index) => {
            const points = student.points || 0;
            html += `
                <div class="member-item ${this.isAuthenticated ? 'editable' : ''}">
                    <div class="member-info">
                        <div class="member-rank">${index + 1}</div>
                        <div class="member-details">
                            <div class="member-name">${student.name}</div>
                            <div class="member-points">${points} crystals</div>
                        </div>
                    </div>
                    ${this.isAuthenticated ? `
                    <div class="member-actions">
                        <button class="point-btn add-point" onclick="app.updateStudentPoints('${student.name}', 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="point-btn remove-point" onclick="app.updateStudentPoints('${student.name}', -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="point-btn bonus-point" onclick="app.updateStudentPoints('${student.name}', 5)">
                            <i class="fas fa-star"></i>
                        </button>
                    </div>
                    ` : ''}
                </div>
            `;
        });

        html += `</div>`;
        
        modalContent.innerHTML = html;
        this.showModal('groupModal');
    }

    updateLastUpdated() {
        const lastUpdatedElement = document.getElementById('lastUpdated');
        if (lastUpdatedElement) {
            const now = new Date();
            lastUpdatedElement.textContent = `Updated: ${now.toLocaleTimeString()}`;
        }
    }

    toggleAuthState(isAuthenticated) {
        const appContainer = document.getElementById('app');
        if (appContainer) {
            if (isAuthenticated) {
                appContainer.classList.add('authenticated');
            } else {
                appContainer.classList.remove('authenticated');
            }
        }
    }

    switchView(view) {
        this.currentView = view;
        const viewButtons = document.querySelectorAll('.view-btn');
        const viewToggle = document.getElementById('viewToggle');
        
        viewButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === view) {
                btn.classList.add('active');
            }
        });

        // Update UI based on view
        if (view === 'teacher' && !this.isAuthenticated) {
            this.showModal('loginModal');
        }
        
        this.showToast(`Switched to ${view} view`, 'info');
    }

    switchClass(className) {
        this.currentClass = className;
        const classDisplay = document.getElementById('currentClassDisplay');
        if (classDisplay) {
            classDisplay.innerHTML = `<i class="fas fa-graduation-cap"></i> ${className}`;
        }
        
        this.loadInitialData();
        this.showToast(`Now viewing ${className}`, 'info');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
            </div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);

        // Add particle effect for success messages
        if (type === 'success') {
            this.createParticles(3);
        }
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    createParticles(count = 5) {
        const container = document.getElementById('particleContainer');
        if (!container) return;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random properties
            const size = Math.random() * 8 + 4;
            const left = Math.random() * 100;
            const animationDuration = Math.random() * 3 + 2;
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${left}%`;
            particle.style.animationDuration = `${animationDuration}s`;
            particle.style.background = this.getRandomColor();
            
            container.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentElement) {
                    particle.remove();
                }
            }, animationDuration * 1000);
        }
    }

    getRandomColor() {
        const colors = [
            'linear-gradient(135deg, #6366f1, #8b5cf6)',
            'linear-gradient(135deg, #10b981, #059669)',
            'linear-gradient(135deg, #f59e0b, #d97706)',
            'linear-gradient(135deg, #8b5cf6, #a855f7)',
            'linear-gradient(135deg, #0ea5e9, #0369a1)'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const appContainer = document.getElementById('app');
        
        if (loadingScreen && appContainer) {
            // Add fade-out animation
            loadingScreen.style.opacity = '0';
            loadingScreen.style.pointerEvents = 'none';
            
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                appContainer.classList.remove('hidden');
                
                // Add fade-in animation for main app
                setTimeout(() => {
                    appContainer.style.opacity = '1';
                }, 50);
            }, 500);
        }
    }

    logout() {
        this.authToken = null;
        this.isAuthenticated = false;
        localStorage.removeItem('jungleAuthToken');
        this.toggleAuthState(false);
        this.showToast('Logged out successfully', 'info');
    }

    exportData() {
        // Simple data export (in a real app, this would generate a CSV or Excel file)
        this.showToast('Export feature coming soon!', 'info');
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;
                this.switchPage(page);
            });
        });

        // Class selector
        const classSelector = document.getElementById('classSelector');
        if (classSelector) {
            classSelector.value = this.currentClass;
            classSelector.addEventListener('change', (e) => {
                this.switchClass(e.target.value);
            });
        }

        // Leaderboard class selector
        const leaderboardClassSelector = document.getElementById('leaderboardClassSelector');
        if (leaderboardClassSelector) {
            leaderboardClassSelector.addEventListener('change', (e) => {
                this.loadLeaderboardData(e.target.value);
            });
        }

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.currentTarget.dataset.view);
            });
        });

        // Tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.showModal('loginModal');
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Login form submission
        const submitLogin = document.getElementById('submitLogin');
        const adminPassword = document.getElementById('adminPassword');
        
        if (submitLogin && adminPassword) {
            submitLogin.addEventListener('click', () => {
                const password = adminPassword.value;
                if (password) {
                    this.verifyAdminPassword(password);
                } else {
                    this.showToast('Please enter password', 'warning');
                }
            });

            // Enter key support for login
            adminPassword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    submitLogin.click();
                }
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshData');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadInitialData();
            });
        }

        // Reset all points
        const resetBtn = document.getElementById('resetAllPoints');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetAllPoints();
            });
        }

        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        // Close modals on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        // Home page CTA buttons
        document.querySelectorAll('[data-page]').forEach(btn => {
            if (btn.closest('.hero-actions')) {
                btn.addEventListener('click', (e) => {
                    const page = e.currentTarget.dataset.page;
                    this.switchPage(page);
                });
            }
        });

        console.log('✅ Event listeners setup complete');
    }

    switchPage(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(`${page}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === page) {
                link.classList.add('active');
            }
        });

        // Load page-specific data
        if (page === 'dashboard') {
            this.loadInitialData();
        } else if (page === 'leaderboard') {
            this.loadLeaderboardData();
        } else if (page === 'admin') {
            this.loadAdminData();
        }

        this.showToast(`Navigated to ${page}`, 'info');
    }

    async loadLeaderboardData(classFilter = 'all') {
        try {
            console.log(`🏆 Loading leaderboard for: ${classFilter}`);
            const result = await this.fetchData(`/groups?class=${encodeURIComponent(classFilter)}`);
            
            if (result.success) {
                this.updateLeaderboardDisplay(result.data, classFilter);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.showToast('Failed to load leaderboard', 'error');
        }
    }

    updateLeaderboardDisplay(groupsData, classFilter) {
        const groupsContent = document.getElementById('groupsLeaderboardContent');
        const individualsContent = document.getElementById('individualsLeaderboardContent');

        if (!groupsContent || !individualsContent) return;

        // Groups leaderboard
        let groupsList = [];
        for (const [className, levels] of Object.entries(groupsData)) {
            for (const [level, groups] of Object.entries(levels)) {
                for (const [groupName, groupData] of Object.entries(groups)) {
                    groupsList.push({
                        name: groupName,
                        class: className,
                        level: level,
                        points: groupData.totalPoints || 0,
                        members: groupData.members ? groupData.members.length : 0
                    });
                }
            }
        }

        // Sort by points
        groupsList.sort((a, b) => b.points - a.points);

        let groupsHtml = '';
        groupsList.forEach((group, index) => {
            const rankClass = index < 3 ? `rank-${index + 1}` : '';
            groupsHtml += `
                <div class="leaderboard-item">
                    <div class="rank ${rankClass}">${index + 1}</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">
                            ${group.name}
                            <span class="group-badge">${group.class}</span>
                        </div>
                        <div class="leaderboard-meta">
                            ${group.level} • ${group.members} members
                        </div>
                    </div>
                    <div class="leaderboard-points">${group.points}</div>
                </div>
            `;
        });

        groupsContent.innerHTML = groupsHtml || '<div class="no-data">No group data available</div>';

        // Individuals leaderboard (simplified - would need student data)
        individualsContent.innerHTML = `
            <div class="feature-coming">
                <i class="fas fa-tools"></i>
                <h3>Individual Rankings Coming Soon</h3>
                <p>We're working on individual student leaderboards!</p>
            </div>
        `;
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.leaderboard-tab').forEach(tabElement => {
            tabElement.classList.remove('active');
            if (tabElement.id === `${tab}Leaderboard`) {
                tabElement.classList.add('active');
            }
        });
    }

    async loadAdminData() {
        try {
            console.log('👨‍💼 Loading admin data...');
            const result = await this.fetchData('/students');
            
            if (result.success) {
                this.updateAdminStats(result.data);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
            this.showToast('Failed to load admin statistics', 'error');
        }
    }

    updateAdminStats(students) {
        const systemStats = document.getElementById('systemStats');
        if (!systemStats) return;

        const totalStudents = students.length;
        const totalCrystals = students.reduce((sum, student) => sum + (student.points || 0), 0);
        
        // Count unique groups
        const groups = new Set();
        students.forEach(student => {
            if (student.class && student.group) {
                groups.add(`${student.class}-${student.group}`);
            }
        });

        systemStats.innerHTML = `
            <div class="stat-item">
                <i class="fas fa-users"></i>
                <span>Total Students: ${totalStudents}</span>
            </div>
            <div class="stat-item">
                <i class="fas fa-gem"></i>
                <span>Total Crystals: ${totalCrystals}</span>
            </div>
            <div class="stat-item">
                <i class="fas fa-layer-group"></i>
                <span>Active Groups: ${groups.size}</span>
            </div>
            <div class="stat-item">
                <i class="fas fa-clock"></i>
                <span>Last Updated: ${new Date().toLocaleTimeString()}</span>
            </div>
        `;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌿 DOM loaded - initializing Jungle Rewards System');
    window.app = new JungleRewardsSystem();
});

// Add some utility functions to global scope for easy access
window.switchPage = (page) => window.app.switchPage(page);
window.switchView = (view) => window.app.switchView(view);

// Service Worker Registration (for PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('SW registered: ', registration);
            })
            .catch(function(registrationError) {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
