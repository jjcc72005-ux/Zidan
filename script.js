class ZidanApp {
    constructor() {
        this.socket = null;
        this.currentUser = null;
        this.connectedUsers = [];
        this.init();
    }

    init() {
        this.showDeviceSelection();
        this.setupEventListeners();
    }

    showDeviceSelection() {
        const modal = document.getElementById('deviceModal');
        modal.style.display = 'block';

        document.querySelectorAll('.device-option').forEach(option => {
            option.addEventListener('click', () => {
                const deviceType = option.getAttribute('data-type');
                this.connectToServer(deviceType);
                modal.style.display = 'none';
            });
        });
    }

    connectToServer(deviceType) {
        this.socket = io();
        
        this.currentUser = {
            name: this.getDeviceName(deviceType),
            deviceType: deviceType
        };

        this.socket.emit('user-connected', this.currentUser);

        this.setupSocketListeners();
    }

    getDeviceName(deviceType) {
        const names = {
            phone: 'هاتف ذكي',
            tablet: 'جهاز لوحي', 
            laptop: 'كمبيوتر محمول'
        };
        return names[deviceType] || 'جهاز';
    }

    setupSocketListeners() {
        this.socket.on('users-updated', (users) => {
            this.connectedUsers = users;
            this.updateDevicesGrid();
        });

        this.socket.on('file-request', (data) => {
            this.showPermissionModal(data);
        });

        this.socket.on('file-accept', (data) => {
            this.startFileTransfer(data);
        });

        this.socket.on('file-reject', (data) => {
            alert('تم رفض استقبال الملف: ' + data.reason);
        });
    }

    setupEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.background = '#f0f4ff';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.background = '';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.background = '';
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
    }

    handleFiles(files) {
        if (files.length > 0) {
            this.showDeviceSelectionForSend(files[0]);
        }
    }

    showDeviceSelectionForSend(file) {
        if (this.connectedUsers.length <= 1) {
            alert('لا توجد أجهزة متصلة!');
            return;
        }

        const otherUsers = this.connectedUsers.filter(user => user.id !== this.socket.id);
        const user = otherUsers[0]; // نختار أول جهاز متاح
        
        this.sendFileRequest(user, file);
    }

    sendFileRequest(targetUser, file) {
        this.socket.emit('file-request', {
            targetUserId: targetUser.id,
            fileName: file.name,
            fileSize: file.size
        });

        this.addTransferToUI(file.name, targetUser.name, 'pending');
    }

    showPermissionModal(data) {
        const modal = document.getElementById('permissionModal');
        const permissionText = document.getElementById('permissionText');
        const acceptBtn = document.getElementById('acceptBtn');
        const rejectBtn = document.getElementById('rejectBtn');

        permissionText.textContent = `${data.from.name} يريد إرسال "${data.fileName}" إليك`;

        const acceptHandler = () => {
            this.socket.emit('file-accept', {
                fromUserId: data.from.id
            });
            modal.style.display = 'none';
            acceptBtn.removeEventListener('click', acceptHandler);
            rejectBtn.removeEventListener('click', rejectHandler);
        };

        const rejectHandler = () => {
            this.socket.emit('file-reject', {
                fromUserId: data.from.id,
                reason: 'رفض المستخدم'
            });
            modal.style.display = 'none';
            acceptBtn.removeEventListener('click', acceptHandler);
            rejectBtn.removeEventListener('click', rejectHandler);
        };

        acceptBtn.addEventListener('click', acceptHandler);
        rejectBtn.addEventListener('click', rejectHandler);

        modal.style.display = 'block';
    }

    startFileTransfer(data) {
        // هنا سيتم تنفيذ نقل الملف باستخدام WebRTC
        console.log('بدء نقل الملف إلى:', data.targetUserId);
        this.updateTransferStatus('نقل الملف جارٍ...');
    }

    updateDevicesGrid() {
        const grid = document.getElementById('devicesGrid');
        const otherUsers = this.connectedUsers.filter(user => user.id !== this.socket.id);

        if (otherUsers.length === 0) {
            grid.innerHTML = '<div class="loading">لا توجد أجهزة متصلة</div>';
            return;
        }

        grid.innerHTML = otherUsers.map(user => `
            <div class="device-card ${user.deviceType}">
                <i class="fas fa-${this.getDeviceIcon(user.deviceType)}"></i>
                <div class="device-name">${user.name}</div>
                <div class="device-status">متصل</div>
            </div>
        `).join('');
    }

    getDeviceIcon(deviceType) {
        const icons = {
            phone: 'mobile-alt',
            tablet: 'tablet-alt',
            laptop: 'laptop'
        };
        return icons[deviceType] || 'desktop';
    }

    addTransferToUI(fileName, targetDevice, status) {
        const transferSection = document.getElementById('transferSection');
        const transfersList = document.getElementById('transfersList');
        
        transferSection.style.display = 'block';
        
        const transferItem = document.createElement('div');
        transferItem.className = 'transfer-item';
        transferItem.innerHTML = `
            <div class="transfer-info">
                <div class="transfer-name">${fileName}</div>
                <div class="transfer-status">إلى: ${targetDevice} - ${status}</div>
                <div class="transfer-progress">
                    <div class="progress-bar"></div>
                </div>
            </div>
        `;
        
        transfersList.appendChild(transferItem);
    }

    updateTransferStatus(status) {
        const transfers = document.querySelectorAll('.transfer-item');
        if (transfers.length > 0) {
            const lastTransfer = transfers[transfers.length - 1];
            const statusElement = lastTransfer.querySelector('.transfer-status');
            statusElement.textContent = status;
        }
    }
}

// بدء التطبيق عندما يتم تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new ZidanApp();
});
