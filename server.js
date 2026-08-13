const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Berber / Admin Telefon Numarası
const BERBER_TELEFON = "905539578598"; 

// Render/Linux sunucularda Chromium'un sorunsuz çalışması için Puppeteer konfigürasyonu
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

// Terminalde / Render Logs sayfasında QR Kod oluşturma
client.on('qr', (qr) => {
    console.log('====================================================');
    console.log('📱 WHATSAPP QR KODU HAZIR! LÜTFEN TELEFONUNUZDAN TARATIN:');
    console.log('====================================================');
    qrcode.generate(qr, { small: true });
});

// WhatsApp Bağlantı Durumu
client.on('ready', () => {
    console.log('✅ WhatsApp Web Başarıyla Bağlandı ve Hazır!');
});

client.on('authenticated', () => {
    console.log('🔑 WhatsApp Oturumu Doğrulandı.');
});

client.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp Oturum Hatası:', msg);
});

client.on('disconnected', (reason) => {
    console.log('⚠️ WhatsApp Bağlantısı Koptu:', reason);
});

// WhatsApp İstemcisini Başlat
client.initialize();

// Test Endpoint (Sunucunun çalışıp çalışmadığını kontrol etmek için)
app.get('/', (req, res) => {
    res.send('Berber Randevu Backend Sunucusu Aktif!');
});

// Randevu Alma Endpoint'i
app.post('/api/randevu-al', async (req, res) => {
    try {
        const { customerInfo, services, selectedDate, selectedTime, totalPrice, totalDuration } = req.body;

        if (!customerInfo || !services || !selectedDate || !selectedTime) {
            return res.status(400).json({ success: false, message: 'Lütfen tüm alanları doldurun.' });
        }

        const serviceNames = services.map(s => s.name).join(', ');

        // WhatsApp Bildirim Mesajı Formatı
        const whatsappMessage = 
`💈 *YENİ RANDEVU TALEBİ!* 💈

👤 *Müşteri Adı:* ${customerInfo.name}
📞 *Telefon:* ${customerInfo.phone}

✂️ *Alınan Hizmetler:* ${serviceNames}
📅 *Tarih:* ${selectedDate}
⏰ *Saat:* ${selectedTime} (${totalDuration} dk)
💰 *Toplam Tutar:* ${totalPrice} TL

_Bu mesaj Berber Randevu Sistemi tarafından otomatik gönderilmiştir._`;

        // Berber numarasına WhatsApp mesajı gönder
        const formattedNumber = `${BERBER_TELEFON}@c.us`;
        await client.sendMessage(formattedNumber, whatsappMessage);

        console.log(`📩 Yeni Randevu Bildirimi Gönderildi: ${customerInfo.name} - ${selectedDate} ${selectedTime}`);

        res.status(200).json({ 
            success: true, 
            message: 'Randevunuz başarıyla oluşturuldu ve berbere iletildi.' 
        });

    } catch (error) {
        console.error('❌ Randevu İşleme Hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Randevu iletilirken bir sunucu hatası oluştu.' 
        });
    }
});

// Sunucuyu Dinlemeye Başla
app.listen(PORT, () => {
    console.log(`🚀 Sunucu ${PORT} portunda çalışıyor.`);
});