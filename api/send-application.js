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
    const data = req.body;

    // Format availability for email
    let availabilityText = '';
    if (data.availability) {
      const avail = typeof data.availability === 'string'
        ? JSON.parse(data.availability)
        : data.availability;

      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      days.forEach(day => {
        if (avail[day]) {
          const shifts = [];
          if (avail[day].morning) shifts.push('Morning');
          if (avail[day].afternoon) shifts.push('Afternoon');
          if (avail[day].evening) shifts.push('Evening');
          if (shifts.length > 0) {
            availabilityText += `${day.charAt(0).toUpperCase() + day.slice(1)}: ${shifts.join(', ')}\n`;
          }
        }
      });
    }

    // Build email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #a30010; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">New Job Application</h1>
          <p style="margin: 10px 0 0;">Bobola's Restaurant</p>
        </div>

        <div style="padding: 20px; background: #f8f8f8;">
          <h2 style="color: #333; border-bottom: 2px solid #a30010; padding-bottom: 10px;">Applicant Information</h2>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 140px;">Name:</td>
              <td style="padding: 8px 0;">${data.fullName || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${data.email}">${data.email || 'Not provided'}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
              <td style="padding: 8px 0;"><a href="tel:${data.phone}">${data.phone || 'Not provided'}</a></td>
            </tr>
          </table>

          <h2 style="color: #333; border-bottom: 2px solid #a30010; padding-bottom: 10px; margin-top: 30px;">Position Details</h2>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 140px;">Position(s):</td>
              <td style="padding: 8px 0;">${Array.isArray(data.positions) ? data.positions.join(', ') : (data.positions || 'Not specified')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Employment:</td>
              <td style="padding: 8px 0;">${Array.isArray(data.employment) ? data.employment.join(', ') : (data.employment || 'Not specified')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Days/Week:</td>
              <td style="padding: 8px 0;">${data.daysPerWeek || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Hours/Week:</td>
              <td style="padding: 8px 0;">${data.hoursPerWeek || 'Not specified'}</td>
            </tr>
          </table>

          <h2 style="color: #333; border-bottom: 2px solid #a30010; padding-bottom: 10px; margin-top: 30px;">Availability</h2>
          <pre style="background: white; padding: 15px; border-radius: 5px; font-family: Arial, sans-serif; white-space: pre-wrap;">${availabilityText || 'Not specified'}</pre>

          <h2 style="color: #333; border-bottom: 2px solid #a30010; padding-bottom: 10px; margin-top: 30px;">Experience & Notes</h2>

          <p style="margin: 10px 0;"><strong>Work Experience:</strong></p>
          <div style="background: white; padding: 15px; border-radius: 5px;">${data.workExperience || 'Not provided'}</div>

          <p style="margin: 10px 0; margin-top: 20px;"><strong>Additional Info:</strong></p>
          <div style="background: white; padding: 15px; border-radius: 5px;">${data.additionalInfo || 'Not provided'}</div>
        </div>

        <div style="background: #333; color: #999; padding: 15px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}</p>
          <p style="margin: 5px 0 0;">IP Address: ${data.ipAddress || 'Unknown'}</p>
          <p style="margin: 5px 0 0;">This application was submitted through bobolasnashua.com</p>
        </div>
      </div>
    `;

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Bobola\'s Jobs <jobs@bobolasnashua.com>',
        to: ['derek.bobola@gmail.com'],
        subject: `New Job Application: ${data.fullName} - ${Array.isArray(data.positions) ? data.positions.join(', ') : 'General'}`,
        html: emailHtml,
        reply_to: data.email,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend error:', result);
      return res.status(500).json({ error: 'Failed to send email', details: result });
    }

    return res.status(200).json({ success: true, id: result.id });

  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
