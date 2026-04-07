const cron = require('node-cron');
const { Appointment, Patient, Doctor, User, Organization } = require('../models');
const whatsapp = require('./whatsapp.service');
const sendEmail = require('./sendEmail');
const {
    getSubscriptionExpiryReminderEmail,
    getSubscriptionExpiredEmail
} = require('./emailTemplates');
const { Op } = require('sequelize');

const runSubscriptionWatchdog = async () => {
    console.log('🔄 Watchdog: Verificando estados de suscripción...');
    const now = new Date();
    const subscriptionUrl = `${process.env.CLIENT_URL || 'http://localhost:4200'}/subscription`;
    const reminderDays = [7, 5, 3, 1];

    // 1. Mark expired subscriptions as PAST_DUE
    const expiredOrgs = await Organization.findAll({
        where: {
            subscriptionStatus: {
                [Op.in]: ['TRIAL', 'ACTIVE']
            },
            trialEndsAt: { [Op.lt]: now }
        },
        include: [{ model: User, as: 'owner' }]
    });

    for (const org of expiredOrgs) {
        console.log(`❌ Suscripción expirada: ${org.name}. Cambiando a PAST_DUE.`);
        await org.update({ subscriptionStatus: 'PAST_DUE' });

        const owner = org.owner || await User.findByPk(org.ownerId);
        if (owner && owner.email) {
            await sendEmail({
                email: owner.email,
                subject: 'Tu suscripción en Clinica SaaS ha vencido',
                message: `Hola ${owner.firstName},\n\nTe informamos que la suscripción de ${org.name} ha vencido y tu cuenta está en estado pendiente de pago.\n\nRenueva aquí: ${subscriptionUrl}\n\nSaludos,\nEquipo Clinica SaaS.`,
                html: getSubscriptionExpiredEmail({
                    nombre: owner.firstName,
                    organizationName: org.name,
                    subscriptionUrl
                })
            });
        }
    }

    // 2. Send reminders at 7, 5, 3 and 1 days before expiration
    for (const daysLeft of reminderDays) {
        const targetStart = new Date(now);
        targetStart.setDate(targetStart.getDate() + daysLeft);
        targetStart.setHours(0, 0, 0, 0);

        const targetEnd = new Date(now);
        targetEnd.setDate(targetEnd.getDate() + daysLeft);
        targetEnd.setHours(23, 59, 59, 999);

        const warningOrgs = await Organization.findAll({
            where: {
                subscriptionStatus: {
                    [Op.in]: ['TRIAL', 'ACTIVE']
                },
                trialEndsAt: {
                    [Op.between]: [targetStart, targetEnd]
                }
            },
            include: [{ model: User, as: 'owner' }]
        });

        for (const org of warningOrgs) {
            const owner = org.owner || await User.findByPk(org.ownerId);
            if (owner && owner.email) {
                const expiresAt = new Date(org.trialEndsAt).toLocaleDateString('es-ES');
                const daysLabel = daysLeft === 1 ? '1 día' : `${daysLeft} días`;

                await sendEmail({
                    email: owner.email,
                    subject: `Recordatorio: tu suscripción vence en ${daysLabel}`,
                    message: `Hola ${owner.firstName},\n\nTe recordamos que la suscripción de ${org.name} vence en ${daysLabel} (fecha de vencimiento: ${expiresAt}).\n\nRenueva aquí: ${subscriptionUrl}\n\nSaludos,\nEquipo Clinica SaaS.`,
                    html: getSubscriptionExpiryReminderEmail({
                        nombre: owner.firstName,
                        organizationName: org.name,
                        daysLeft,
                        expiresAt,
                        subscriptionUrl
                    })
                });
            }
        }
    }
};

const startScheduler = () => {
    console.log('⏰ Scheduler iniciado: Comprobando citas cada minuto...');
    
    // Check every minute
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const fifteenMinutesLater = new Date(now.getTime() + 15 * 60000);
            const twentyMinutesLater = new Date(now.getTime() + 20 * 60000); // Window of 5 mins

            // Find appointments happening in 15-20 mins that haven't been reminded
            const appointments = await Appointment.findAll({
                where: {
                    date: {
                        [Op.between]: [fifteenMinutesLater, twentyMinutesLater]
                    },
                    status: 'Confirmed',
                    reminderSent: false
                },
                include: [
                    { model: Patient, include: [User] },
                    { model: Doctor, include: [User] }
                ]
            });

            if (appointments.length > 0) {
                console.log(`🔎 Encontradas ${appointments.length} citas para recordar.`);
            }

            for (const appt of appointments) {
                const patientPhone = appt.Patient.user ? appt.Patient.User.phone : appt.Patient.phone;
                const patientName = `${appt.Patient.User.firstName} ${appt.Patient.User.lastName}`;
                const doctorName = `${appt.Doctor.User.firstName} ${appt.Doctor.User.lastName}`;
                const apptTime = new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                 // Get phone from Patient -> User.phone or Patient.phone if stored there. 
                 // Based on User model, phone is on User.
                 
                if (patientPhone) {
                    await whatsapp.sendAppointmentReminder(patientPhone, {
                        patientName,
                        time: apptTime,
                        doctorName,
                        appointmentId: appt.id
                    });

                    // Mark as sent
                    appt.reminderSent = true;
                    await appt.save();
                }
            }

        } catch (error) {
            console.error('❌ Scheduler Error:', error);
        }
    });
    // Check subscriptions daily at 00:01
    cron.schedule('1 0 * * *', async () => {
        try {
            await runSubscriptionWatchdog();

        } catch (error) {
            console.error('❌ Watchdog Error:', error);
        }
    });
};

module.exports = startScheduler;
module.exports.runSubscriptionWatchdog = runSubscriptionWatchdog;
