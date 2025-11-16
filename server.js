const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// إنشاء مجلد المشاريع إذا لم يكن موجوداً
const projectsDir = path.join(__dirname, 'projects');
if (!fs.existsSync(projectsDir)) {
    fs.mkdirSync(projectsDir, { recursive: true });
}

// API لتحويل HTML إلى مشروع
app.post('/api/convert/html', async (req, res) => {
    try {
        const { html, appName = "My HTML App" } = req.body;
        
        if (!html) {
            return res.status(400).json({ 
                success: false, 
                error: 'يرجى إدخال كود HTML' 
            });
        }

        const projectId = 'project_' + Date.now();
        const projectPath = path.join(projectsDir, projectId);
        fs.mkdirSync(projectPath, { recursive: true });

        // ملف HTML الرئيسي
        const mainHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName}</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: Arial, sans-serif; 
            background: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        ${html}
    </div>
</body>
</html>`;

        // ملف config.xml
        const configXml = `<?xml version='1.0' encoding='utf-8'?>
<widget id="com.htmlconverter.app${projectId}" version="1.0.0" xmlns="http://www.w3.org/ns/widgets">
    <name>${appName}</name>
    <description>تم الإنشاء باستخدام محول HTML إلى APK</description>
    <author email="support@htmlconverter.com">مطور عربي</author>
    <content src="index.html" />
    <access origin="*" />
    <preference name="ScrollEnabled" value="false" />
    <preference name="android-minSdkVersion" value="19" />
</widget>`;

        // ملف package.json للمشروع
        const packageJson = {
            "name": `html-app-${projectId}`,
            "displayName": appName,
            "version": "1.0.0",
            "description": "HTML to APK Converter App",
            "main": "index.html",
            "scripts": {
                "build": "echo 'استخدم منصة مثل PhoneGap Build لبناء APK'"
            },
            "keywords": ["html", "app", "android"],
            "author": "HTML Converter",
            "license": "MIT"
        };

        // حفظ الملفات
        fs.writeFileSync(path.join(projectPath, 'index.html'), mainHtml);
        fs.writeFileSync(path.join(projectPath, 'config.xml'), configXml);
        fs.writeFileSync(path.join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));
        
        // ملف التعليمات
        const instructions = `
📱 **تعليمات بناء APK:**

1. **قم بتحميل هذا المشروع** على إحدى المنصات التالية:
   
2. **المنصات المجانية:**
   - 🔗 [PhoneGap Build](https://build.phonegap.com)
   - 🔗 [GitHub Pages] (للمواقع الثابتة)
   - 🔗 [Netlify] (استضافة مجانية)

3. **طريقة الاستخدام:**
   - ارفع ملف **config.xml** و **index.html**
   - انتظر حتى يتم البناء
   - حمّل ملف APK النهائي

4. **لمطوري Android:**
   - يمكنك استخدام Android Studio
   - إنشاء WebView project
   - استبدل محتوى WebView بهذا الـ HTML

🎉 **تهانينا! لديك الآن تطبيق أندرويد جاهز.**
        `;

        res.json({
            success: true,
            message: 'تم إنشاء المشروع بنجاح',
            projectId: projectId,
            downloadUrl: `/api/download/html/${projectId}`,
            instructions: instructions
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'حدث خطأ أثناء التحويل' 
        });
    }
});

// API لتحويل رابط إلى WebView App
app.post('/api/convert/url', async (req, res) => {
    try {
        const { url, appName = "WebView App" } = req.body;
        
        if (!url) {
            return res.status(400).json({ 
                success: false, 
                error: 'يرجى إدخال رابط الموقع' 
            });
        }

        const projectId = 'url_project_' + Date.now();
        const projectPath = path.join(projectsDir, projectId);
        fs.mkdirSync(projectPath, { recursive: true });

        // إنشاء تطبيق WebView
        const webViewHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName}</title>
    <style>
        body, html { 
            margin: 0; 
            padding: 0; 
            height: 100%; 
            overflow: hidden;
        }
        iframe { 
            width: 100%; 
            height: 100%; 
            border: none;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-family: Arial, sans-serif;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <div class="loading" id="loading">جاري تحميل ${url}...</div>
    <iframe src="${url}" id="webview" onload="document.getElementById('loading').style.display='none'"></iframe>
    
    <script>
        // إضافة تحكم في الزر الخلفي
        document.addEventListener('backbutton', function() {
            history.back();
        }, false);
    </script>
</body>
</html>`;

        // ملف config.xml
        const configXml = `<?xml version='1.0' encoding='utf-8'?>
<widget id="com.webview.app${projectId}" version="1.0.0" xmlns="http://www.w3.org/ns/widgets">
    <name>${appName}</name>
    <description>WebView App for ${url}</description>
    <author email="support@htmlconverter.com">HTML Converter</author>
    <content src="index.html" />
    <access origin="*" />
    <allow-intent href="http://*/*" />
    <allow-intent href="https://*/*" />
    <preference name="AndroidInsecureFileModeEnabled" value="true" />
</widget>`;

        // حفظ الملفات
        fs.writeFileSync(path.join(projectPath, 'index.html'), webViewHtml);
        fs.writeFileSync(path.join(projectPath, 'config.xml'), configXml);

        const instructions = `
🌐 **تطبيق WebView جاهز:**

📋 **المميزات:**
- ✅ يفتح الموقع: ${url}
- ✅ دعم كامل للشاشات
- ✅ تحكم في الزر الخافي
- ✅ تصميم متجاوب

🚀 **طريقة البناء:**

1. **استخدم إحدى هذه المنصات:**
   - 🔗 [PhoneGap Build] (مجاني)
   - 🔗 [Cordova] (محلي)
   - 🔗 [Android Studio] (لمطوري Android)

2. **خطوات سريعة:**
   - ارفع ملفات المشروع
   - انتظر اكتمال البناء
   - حمّل APK النهائي

💡 **نصيحة:** يمكنك تعديل التصميم بتغيير محتوى index.html
        `;

        res.json({
            success: true,
            message: 'تم إنشاء تطبيق WebView بنجاح',
            projectId: projectId,
            downloadUrl: `/api/download/url/${projectId}`,
            instructions: instructions
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'حدث خطأ أثناء تحويل الرابط' 
        });
    }
});

// تحميل ملفات المشروع
app.get('/api/download/html/:projectId', (req, res) => {
    const projectId = req.params.projectId;
    const projectPath = path.join(projectsDir, projectId);
    
    if (fs.existsSync(projectPath)) {
        // إرجاع ملف ZIP بسيط (في الإنتاج الحقيقي استخدم مكتبة archiver)
        res.json({
            success: true,
            message: 'يمكنك تحميل الملفات من المجلد التالي:',
            files: fs.readdirSync(projectPath),
            projectPath: projectPath
        });
    } else {
        res.status(404).json({ error: 'المشروع غير موجود' });
    }
});

app.get('/api/download/url/:projectId', (req, res) => {
    const projectId = req.params.projectId;
    const projectPath = path.join(projectsDir, projectId);
    
    if (fs.existsSync(projectPath)) {
        res.json({
            success: true,
            message: 'ملفات WebView جاهزة:',
            files: fs.readdirSync(projectPath),
            projectPath: projectPath
        });
    } else {
        res.status(404).json({ error: 'المشروع غير موجود' });
    }
});

// صفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// تشغيل الخادم
app.listen(PORT, () => {
    console.log('🚀 الخادم يعمل على http://localhost:' + PORT);
    console.log('📱 محول HTML إلى APK جاهز!');
});

module.exports = app;
