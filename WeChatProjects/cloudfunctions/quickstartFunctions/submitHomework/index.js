// cloudfunctions/quickstartFunctions/submitHomework/index.js
const cloud = require("wx-server-sdk");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // Add collection creation check
    const collections = await db.listCollections();
    if (!collections.data.some(col => col.name === 'homeworks')) {
      await db.createCollection('homeworks');
    }

    const { type, time } = event;
    
    // Add input validation
    if (!type || !time) {
      throw new Error('Missing required parameters: type or time');
    }
    if (type !== 'text' && type !== 'voice' && type !== 'image') {
      throw new Error('Invalid type parameter. Must be "text", "voice" or "image"');
    }
    if (type === 'text' && !event.content) {
      throw new Error('Missing content for text submission');
    }
    if (type === 'voice' && (!event.fileID || !event.duration)) {
      throw new Error('Missing fileID or duration for voice submission');
    }
    if (type === 'image' && (!event.fileIDs || !Array.isArray(event.fileIDs))) {
      throw new Error('Missing fileIDs for image submission');
    }
    const wxContext = cloud.getWXContext();

    // Submit homework to database
    const result = await db.collection("homeworks").add({
      data: {
        openid: wxContext.OPENID,
        type: type,
        content: type === "text" ? event.content : 
               (type === "voice" ? event.fileID : event.fileIDs),
        duration: type === "voice" ? event.duration : 0,
        time: time,
        status: "pending",
        createdAt: db.serverDate(),
      },
    });

    return {
      success: true,
      data: result,
    };
  } catch (err) {
    console.error("云函数执行失败:", err);
    return {
      success: false,
      errMsg: err.message,
      errCode: err.errCode || 'CLOUD_FUNCTION_ERROR'
    };
  }
};
