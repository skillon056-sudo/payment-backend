const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// हर 24 घंटे में run होगा – 7 दिन से पुराने failed/pending orders delete
exports.deleteOldOrders = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 दिन पुराने
    const cutoff = admin.firestore.Timestamp.fromDate(new Date(sevenDaysAgo));

    const ordersRef = admin.firestore().collection('orders');
    const snapshot = await ordersRef
      .where('status', 'in', ['pending', 'failed'])
      .where('createdAt', '<', cutoff)
      .get();

    if (snapshot.empty) {
      console.log('No old failed/pending orders to delete');
      return null;
    }

    const batch = admin.firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${snapshot.size} old failed/pending orders`);

    return null;
  });