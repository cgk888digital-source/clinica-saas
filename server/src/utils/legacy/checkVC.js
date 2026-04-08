const { VideoConsultation, Appointment } = require('../../models');

const checkDB = async () => {
  try {
    const vcs = await VideoConsultation.findAll();
    console.log('📊 Video Consultations in DB:', vcs.length);
    vcs.forEach(vc => {
      console.log(`   ID: ${vc.id}, Room: ${vc.roomId}, ApptID: ${vc.appointmentId}, Status: ${vc.status}`);
    });

    // Verify ALL IDs
    const { User, Appointment } = require('../../models');
    
    for (const verificationId of [1, 2, 3]) {
        console.log(`\n🔍 Verifying VC ID ${verificationId}...`);
        try {
            const vc = await VideoConsultation.findByPk(verificationId, {
                include: [
                  { model: User, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email'] },
                  { model: User, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email'] },
                  { model: Appointment, attributes: ['id', 'date', 'reason', 'status'] }
                ]
            });
            
            if (vc) {
                console.log(`✅ ID ${verificationId} OK`);
            } else {
                console.warn(`⚠️ ID ${verificationId} NOT FOUND`);
            }
        } catch (err) {
            console.error(`❌ ID ${verificationId} ERROR:`, err.message);
        }
    }
     appts.forEach(a => {
      console.log(`   ID: ${a.id}, Date: ${a.date}, Status: ${a.status}`);
    });

  } catch (error) {
    console.error('Error checking DB:', error);
  }
};

if (require.main === module) {
  const sequelize = require('../config/db.config');
  sequelize.authenticate().then(() => {
    checkDB().then(() => process.exit(0));
  });
}
