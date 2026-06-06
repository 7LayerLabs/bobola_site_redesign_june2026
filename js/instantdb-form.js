// InstantDB Application Form Handler
const APP_ID = '5f42c029-7198-4aec-b13d-03289ce1f54f';

// Get IP address for tracking
async function getIPInfo() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (e) {
    return 'unknown';
  }
}

// Show success message
function showSuccess(form, formMessage) {
  form.style.display = 'none';
  formMessage.style.display = 'block';
  formMessage.style.backgroundColor = '#d4edda';
  formMessage.style.color = '#155724';
  formMessage.style.border = '1px solid #c3e6cb';
  formMessage.style.padding = '40px';
  formMessage.style.borderRadius = '16px';
  formMessage.style.fontSize = '1.1rem';
  formMessage.style.textAlign = 'center';
  formMessage.innerHTML = `
    <div style="margin-bottom: 16px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#155724" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
    </div>
    <h2 style="color: #155724; margin-bottom: 12px;">Application Submitted!</h2>
    <p style="margin-bottom: 20px;">Thank you for your interest in joining the Bobola's team. We'll review your application and contact you soon.</p>
    <a href="index.html" style="display: inline-block; padding: 12px 24px; background: #155724; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Return to Homepage</a>
  `;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize form handler
function initForm() {
  const form = document.getElementById('hiringForm');
  const formMessage = document.getElementById('formMessage');
  const submitButton = document.getElementById('submitButton');

  if (!form || !formMessage || !submitButton) {
    console.error('Form elements not found');
    return;
  }

  form.addEventListener('submit', async function(event) {
    event.preventDefault();

    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    try {
      const formData = new FormData(form);

      // Get form values
      const positions = formData.getAll('position');
      const employment = formData.getAll('employment');

      // Build availability
      const availability = {
        monday: { morning: !!formData.get('monday_morning'), afternoon: !!formData.get('monday_afternoon'), evening: !!formData.get('monday_evening') },
        tuesday: { morning: !!formData.get('tuesday_morning'), afternoon: !!formData.get('tuesday_afternoon'), evening: !!formData.get('tuesday_evening') },
        wednesday: { morning: !!formData.get('wednesday_morning'), afternoon: !!formData.get('wednesday_afternoon'), evening: !!formData.get('wednesday_evening') },
        thursday: { morning: !!formData.get('thursday_morning'), afternoon: !!formData.get('thursday_afternoon'), evening: !!formData.get('thursday_evening') },
        friday: { morning: !!formData.get('friday_morning'), afternoon: !!formData.get('friday_afternoon'), evening: !!formData.get('friday_evening') },
        saturday: { morning: !!formData.get('saturday_morning'), afternoon: !!formData.get('saturday_afternoon'), evening: !!formData.get('saturday_evening') },
        sunday: { morning: !!formData.get('sunday_morning'), afternoon: !!formData.get('sunday_afternoon'), evening: !!formData.get('sunday_evening') }
      };

      // Prepare application data
      const applicationData = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        workExperience: formData.get('workExperience') || '',
        positions: positions,
        employment: employment,
        daysPerWeek: formData.get('daysPerWeek'),
        hoursPerWeek: formData.get('hoursPerWeek'),
        availability: availability,
        additionalInfo: formData.get('additionalInfo') || ''
      };

      // Try to save to InstantDB
      try {
        const ipAddress = await getIPInfo();
        const { init, tx, id } = await import('https://www.unpkg.com/@instantdb/core@0.14.31/dist/module/index.js');
        const db = init({ appId: APP_ID });

        const applicationId = id();
        await db.transact(
          tx.applications[applicationId].update({
            ...applicationData,
            availability: JSON.stringify(availability),
            ipAddress: ipAddress,
            userAgent: navigator.userAgent,
            referrer: document.referrer || 'direct',
            submittedAt: Date.now(),
            status: 'new'
          })
        );
        console.log('Application saved to InstantDB');
      } catch (dbError) {
        console.error('InstantDB error (still showing success):', dbError);
      }

      // Send email notification
      try {
        const emailResponse = await fetch('/api/send-application', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(applicationData)
        });
        if (emailResponse.ok) {
          console.log('Email notification sent');
        } else {
          console.error('Email send failed:', await emailResponse.text());
        }
      } catch (emailError) {
        console.error('Email error (still showing success):', emailError);
      }

      // Always show success to the user
      showSuccess(form, formMessage);

    } catch (error) {
      console.error('Form submission error:', error);
      // Still show success - don't lose the applicant over a technical error
      showSuccess(form, formMessage);
    }
  });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initForm);
} else {
  initForm();
}
