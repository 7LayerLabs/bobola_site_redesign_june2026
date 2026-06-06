export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const data = req.body || {};
    const rating = Number(data.rating) || 0;
    const stars = '★'.repeat(rating) + '☆'.repeat(Math.max(0, 5 - rating));
    const message = (data.message || '').toString().slice(0, 4000);
    const contact = (data.contact || '').toString().slice(0, 200);

    // Basic spam honeypot
    if (data.botcheck) {
      return res.status(200).json({ success: true });
    }
    if (!message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ratingColor = rating <= 2 ? '#c0392b' : '#a30010';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #a30010; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">New Guest Feedback</h1>
          <p style="margin: 10px 0 0;">Bobola's Restaurant</p>
        </div>

        <div style="padding: 20px; background: #f8f8f8;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 110px;">Rating:</td>
              <td style="padding: 8px 0; font-size: 20px; color: ${ratingColor};">${stars} &nbsp;(${rating}/5)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Contact:</td>
              <td style="padding: 8px 0;">${contact ? contact : '<em>not provided</em>'}</td>
            </tr>
          </table>

          <h2 style="color: #333; border-bottom: 2px solid #a30010; padding-bottom: 10px; margin-top: 24px;">What they said</h2>
          <div style="background: white; padding: 16px; border-radius: 5px; white-space: pre-wrap; line-height: 1.5;">${message.replace(/</g, '&lt;')}</div>
        </div>

        <div style="background: #333; color: #999; padding: 15px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}</p>
          <p style="margin: 5px 0 0;">Sent via the feedback QR at bobolasnashua.com/feedback.html</p>
        </div>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Bobola\'s Feedback <feedback@bobolasnashua.com>',
        to: ['derek.bobola@gmail.com'],
        subject: `Guest feedback: ${rating}/5 star${rating === 1 ? '' : 's'}${rating <= 2 ? ' — needs attention' : ''}`,
        html: emailHtml,
        ...(contact.includes('@') ? { reply_to: contact } : {}),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend error:', result);
      return res.status(500).json({ error: 'Failed to send email', details: result });
    }

    return res.status(200).json({ success: true, id: result.id });

  } catch (error) {
    console.error('Feedback send error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
