const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// إعدادات multer لرفع الملفات
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// خدمة الملفات الثابتة
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// تخزين المستخدمين المتصلين
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('مستخدم متصل:', socket.id);

  // إضافة المستخدم إلى القائمة
  socket.on('user-connected', (userData) => {
    connectedUsers.set(socket.id, {
      id: socket.id,
      name: userData.name || `Device ${socket.id.substring(0, 5)}`,
      deviceType: userData.deviceType,
      timestamp: new Date()
    });

    // إرسال قائمة المستخدمين المحدثة للجميع
    io.emit('users-updated', Array.from(connectedUsers.values()));
  });

  // طلب إرسال ملف
  socket.on('file-request', (data) => {
    socket.to(data.targetUserId).emit('file-request', {
      from: connectedUsers.get(socket.id),
      fileName: data.fileName,
      fileSize: data.fileSize
    });
  });

  // قبول استقبال الملف
  socket.on('file-accept', (data) => {
    socket.to(data.fromUserId).emit('file-accept', {
      targetUserId: socket.id
    });
  });

  // رفض استقبال الملف
  socket.on('file-reject', (data) => {
    socket.to(data.fromUserId).emit('file-reject', {
      reason: data.reason || 'تم رفض الملف'
    });
  });

  // إرسال إشارات WebRTC
  socket.on('webrtc-signal', (data) => {
    socket.to(data.targetUserId).emit('webrtc-signal', {
      signal: data.signal,
      fromUserId: socket.id
    });
  });

  // فصل المستخدم
  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
    io.emit('users-updated', Array.from(connectedUsers.values()));
    console.log('مستخدم انقطع:', socket.id);
  });
});

// مسار لرفع الملفات
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'لم يتم اختيار ملف' });
  }
  
  res.json({
    success: true,
    file: {
      name: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
  console.log(`📱 افتح هذا الرابط على جميع الأجهزة في نفس الشبكة`);
});
