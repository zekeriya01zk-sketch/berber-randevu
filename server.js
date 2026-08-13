const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(cors());
app.use(express.json());

// Gökhan Usta Telefon Numarası
const USTANIN_TELEFONU = "905539578598@c.us";

// WhatsApp Client Kurulumu (Oturum bilgileri saklanır)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Terminalde QR Kod Gösterimi
client.on('qr', (qr) => {
    console.log('\n--- WHATSAPP BAGLANTISI ---');
    console.log('Lutfen asagidaki QR kodu WhatsApp Business uygulamanizdan taratin:\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\n✅ WhatsApp Otomatik Mesaj Sistemi Başarıyla Bağlandı ve Hazır!');
});

// Randevu Alma API Endpoint'i
app.post('/api/randevu-al', async (req, res) => {
    const { name, phone, services, date, time, totalPrice, totalDuration } = req.body;

    console.log(`\n📩 Yeni Randevu İsteği Geldi: ${name} (${phone})`);

    const mesaj = `💈 *YENİ RANDEVU TALEBİ* 💈\n\n` +
                  `👤 *Müşteri:* ${name}\n` +
                  `📞 *Telefon:* ${phone}\n` +
                  `✂️ *İşlemler:* ${services}\n` +
                  `📅 *Tarih:* ${date}\n` +
                  `⏰ *Saat:* ${time}\n` +
                  `💰 *Toplam Tutar:* ${totalPrice} TL (${totalDuration} dk)`;

    try {
        // 1. Sana Bildirim Mesajı Atar
        await client.sendMessage(USTANIN_TELEFONU, mesaj);

        // 2. Müşteriye Otomatik Onay Mesajı Atar
        const temizTel = phone.replace(/\D/g, '');
        const musteriFormatliTel = `90${temizTel.slice(-10)}@c.us`;
        
        const musteriMesaj = `Merhaba Sayın *${name}*,\n\n${date} - ${time} tarihli randevu talebiniz Gökhan Kodak Berber Salonu'na ulaşmıştır.\n\nBizi tercih ettiğiniz için teşekkür ederiz! 💈`;
        
        await client.sendMessage(musteriFormatliTel, musteriMesaj);

        console.log('✅ Mesajlar hem ustaya hem müşteriye otomatik iletildi.');
        res.status(200).json({ success: true, message: 'Randevu başarıyla iletildi.' });
    } catch (error) {
        console.error('❌ Mesaj gönderme hatası:', error);
        res.status(500).json({ success: false, message: 'WhatsApp mesajı gönderilemedi.' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Arka plan sunucusu http://localhost:${PORT} üzerinde çalışıyor...`);
});

client.initialize();