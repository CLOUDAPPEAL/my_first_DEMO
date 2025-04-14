// pages/index/index.js
Page({
  data: {
    imageList: [], // 存储选择的图片
    isRecording: false, // 是否正在录音
    recordTime: 0, // 录音时长
    recordTimer: null // 录音计时器
  },

  onLoad: function(options) {
    // Add cloud initialization check
    if (!wx.cloud) {
      console.error('请使用基础库2.2.3或以上');
      wx.showToast({
        title: '请使用基础库2.2.3或以上',
        icon: 'none'
      });
      return;
    }
    
    try {
      wx.cloud.init({
        env: "cloud1-7g8zvttq86cae3cc", // Make sure this matches your actual env ID
        traceUser: true,
      });
    } catch (e) {
      console.error('云初始化失败:', e);
    }
  },

  chooseImage: function() {
    wx.chooseImage({
      count: 9 - this.data.imageList.length,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          imageList: this.data.imageList.concat(res.tempFilePaths)
        });
      }
    });
  },

  deleteImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const imageList = this.data.imageList;
    imageList.splice(index, 1);
    this.setData({ imageList });
  },

  submitImageHomework: function() {
    if (this.data.imageList.length === 0) {
      wx.showToast({
        title: '请至少选择一张图片',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '上传中...',
    });
    
    const uploadTasks = this.data.imageList.map((tempFilePath, index) => {
      const cloudPath = `homework-images/${Date.now()}-${index}.jpg`;
      return wx.cloud.uploadFile({
        cloudPath,
        filePath: tempFilePath
      });
    });
    
    Promise.all(uploadTasks)
      .then(results => {
        const fileIDs = results.map(res => res.fileID);
        return wx.cloud.callFunction({
          name: 'submitHomework',
          data: {
            type: 'image',
            fileIDs: fileIDs,
            time: new Date()
          }
        });
      })
      .then(res => {
        wx.hideLoading();
        wx.showToast({
          title: '提交成功',
          icon: 'success'
        });
        this.setData({ imageList: [] });
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: '提交失败',
          icon: 'none'
        });
        console.error('提交图片作业失败:', err);
      });
  },

  startRecord: function() {
    // Add permission check
    wx.getSetting({
      success: res => {
        if (!res.authSetting['scope.record']) {
          wx.authorize({
            scope: 'scope.record',
            success: () => this._startRecording(),
            fail: () => {
              wx.showToast({
                title: '需要录音权限',
                icon: 'none'
              });
            }
          });
        } else {
          this._startRecording();
        }
      }
    });
  },

  _startRecording: function() {
    this.setData({
      isRecording: true,
      recordTime: 0
    });
    
    wx.startRecord({
      success: res => {
        this.handleRecordSuccess(res.tempFilePath);
      },
      fail: err => {
        this.setData({
          isRecording: false
        });
        wx.showToast({
          title: '录音失败',
          icon: 'none'
        });
        console.error('录音失败:', err);
      }
    });
    
    this.data.recordTimer = setInterval(() => {
      this.setData({
        recordTime: this.data.recordTime + 1
      });
    }, 1000);
  },

  stopRecord: function() {
    if (!this.data.isRecording) return;
    
    wx.stopRecord();
    clearInterval(this.data.recordTimer);
    this.setData({
      isRecording: false,
      recordTimer: null
    });
  },

  handleRecordSuccess: function(tempFilePath) {
    wx.showLoading({
      title: '上传中...',
    });
    
    const cloudPath = 'voice-homework/' + Date.now() + '.mp3';
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: tempFilePath,
      success: res => {
        wx.cloud.callFunction({
          name: 'submitHomework',
          data: {
            type: 'voice',
            fileID: res.fileID,
            duration: this.data.recordTime,
            time: new Date()
          },
          success: res => {
            wx.hideLoading();
            wx.showToast({
              title: '提交成功',
              icon: 'success'
            });
            this.setData({
              recordTime: 0
            });
          },
          fail: err => {
            wx.hideLoading();
            wx.showToast({
              title: '提交失败',
              icon: 'none'
            });
            console.error('提交口语作业失败:', err);
          }
        });
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '上传失败: ' + (err.errMsg || '未知错误'),
          icon: 'none'
        });
        console.error('上传录音文件失败:', err);
      }
    });
  },

  onUnload: function() {
    if (this.data.isRecording) {
      this.stopRecord();
    }
  }
});
