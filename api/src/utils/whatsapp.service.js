/**
 * WhatsApp Service (Simulation)
 * In a real environment, you would use Twilio, UltraMsg, or a similar provider.
 */
class WhatsAppService {
  
  _generateGoogleCalendarLink(title, dateStr, durationMinutes = 30, details = '') {
    const startDate = new Date(dateStr);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    const formatDate = (date) => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    };

    const start = formatDate(startDate);
    const end = formatDate(endDate);

    const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
    const params = new URLSearchParams({
      text: title,
      dates: `${start}/${end}`,
      details: details,
      location: 'Clínica Clinica SaaS'
    });

    return `${baseUrl}&${params.toString()}`;
  }

  async sendAppointmentConfirmation(patientPhone, appointmentDetails) {
    const { patientName, date, time, doctorName, appointmentId } = appointmentDetails;
    
    // Construct a full Date object for the calendar link
    // Assuming 'date' and 'time' strings allow us to construct a valid date, or we use a raw Date object passed in 'dateObj'
    // For simplicity, let's assume 'appointmentDetails.rawDate' is the JS Date object
    const rawDate = appointmentDetails.rawDate || new Date(); 

    const calendarLink = this._generateGoogleCalendarLink(
      `Cita Médica - Dr. ${doctorName}`,
      rawDate,
      30,
      `Cita con Dr. ${doctorName}. Paciente: ${patientName}. Para reagendar o cancelar, contacte a la clínica.`
    );

    const message = `✅ *Cita Confirmada*

Hola ${patientName}, tu cita ha sido agendada con éxito:

📅 *Fecha:* ${date}
⏰ *Hora:* ${time}
👨‍⚕️ *Doctor:* ${doctorName}
🏥 *Clínica Clinica SaaS*

📅 *Añadir a tu calendario:*
${calendarLink}

Si deseas cancelar o reagendar, por favor utiliza el siguiente enlace:
https://clinicasaas.app/citas/gestion/${appointmentId}

¡Te esperamos!`;

    this._simulateSend(patientPhone, message);
    return { success: true, messageId: 'conf-' + Date.now() };
  }

  async sendAppointmentReminder(patientPhone, appointmentDetails) {
    const { patientName, time, doctorName, appointmentId } = appointmentDetails;
    
    const message = `🔔 *Recordatorio de Cita*

Hola ${patientName}, te recordamos que tienes una cita en 15 minutos:

⏰ *Hora:* ${time}
👨‍⚕️ *Doctor:* ${doctorName}

Si no puedes asistir, por favor notifícanos inmediatamente:
https://clinicasaas.app/citas/cancelar/${appointmentId}`;

    this._simulateSend(patientPhone, message);
    return { success: true, messageId: 'rem-' + Date.now() };
  }

  async sendCancellationNotice(patientPhone, { patientName, date, time }) {
    const message = `❌ *Cita Cancelada*

Hola ${patientName}, tu cita del ${date} a las ${time} ha sido cancelada.`;

    this._simulateSend(patientPhone, message);
    return { success: true };
  }

  _simulateSend(to, body) {
    console.log('\n📱 --- WHATSAPP SIMULADO ---');
    console.log(`➡️ Para: ${to}`);
    console.log(`💬 Mensaje:\n${body}`);
    console.log('-----------------------------\n');
  }
}

module.exports = new WhatsAppService();
