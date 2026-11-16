import express from 'express';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Email sending endpoint
app.post('/api/send', async (req, res) => {
  try {
    const { apiKey, from, to, subject, html, text, replyTo, cc, bcc } = req.body;

    // UI থেকে API Key দিলে সেটি ব্যবহার করবে, নাহলে .env থেকে নেবে
    const activeApiKey = apiKey?.trim() || process.env.RESEND_API_KEY;

    if (!activeApiKey) {
      return res.status(400).json({
        success: false,
        error: 'Resend API Key পাওয়া যায়নি। .env ফাইলে অথবা UI-তে API Key দাও।'
      });
    }

    if (!from || !to || !subject || (!html && !text)) {
      return res.status(400).json({
        success: false,
        error: 'From, To, Subject এবং Message—এই ফিল্ডগুলো পূরণ করা বাধ্যতামূলক।'
      });
    }

    const resend = new Resend(activeApiKey);

    const payload = {
      from,
      to: Array.isArray(to) ? to : to.split(',').map(e => e.trim()).filter(Boolean),
      subject,
    };

    if (html) payload.html = html;
    if (text) payload.text = text;
    if (replyTo) payload.reply_to = replyTo;
    if (cc) payload.cc = cc.split(',').map(e => e.trim()).filter(Boolean);
    if (bcc) payload.bcc = bcc.split(',').map(e => e.trim()).filter(Boolean);

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      return res.status(400).json({ success: false, error });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal Server Error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
