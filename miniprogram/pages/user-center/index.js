Page({
  data: {
    userInfo: null,
    homeworkStats: {
      total: 0,
      text: 0,
      voice: 0
    }
  },

  onLoad: function() {
    this.getUserInfo();
    this.getHomeworkStats();
  },

  getUserInfo: function() {
    const app = getApp();
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      });
    } else {
      wx.getUserProfile({
        desc: '用于展示用户信息',
        success: res => {
          app.globalData.userInfo = res.userInfo;
          this.setData({
            userInfo: res.userInfo
          });
        }
      });
    }
  },

  getHomeworkStats: function() {
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'selectRecord',
        collection: 'homeworks'
      },
      success: res => {
        const data = res.result.data || [];
        this.setData({
          homeworkStats: {
            total: data.length,
            text: data.filter(item => item.type === 'text').length,
            voice: data.filter(item => item.type === 'voice').length
          }
        });
      },
      fail: err => {
        console.error('获取作业统计失败:', err);
      }
    });
  },

  viewHomeworkHistory: function() {
    wx.navigateTo({
      url: '/pages/homework-history/index'
    });
  }
});
