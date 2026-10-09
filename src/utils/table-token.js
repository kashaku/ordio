export function createTableToken() {
  return new Promise((resolve, reject) => {
    wx.getRandomValues({
      length: 18,
      success: ({ randomValues }) => {
        const value = wx.arrayBufferToBase64(randomValues)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/g, '')
        resolve(`tbl_${value}`)
      },
      fail: reject,
    })
  })
}
