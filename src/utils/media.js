function chooseImagePath() {
  return new Promise((resolve, reject) => {
    if (typeof uni.chooseMedia === 'function') {
      uni.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sizeType: ['compressed'],
        success(result) {
          const file = result.tempFiles && result.tempFiles[0]
          resolve(file && (file.tempFilePath || file.path))
        },
        fail: reject,
      })
      return
    }

    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      success(result) {
        resolve(result.tempFilePaths && result.tempFilePaths[0])
      },
      fail: reject,
    })
  })
}

function saveImagePath(tempFilePath) {
  return new Promise((resolve, reject) => {
    if (!tempFilePath) {
      reject(new Error('没有获取到图片'))
      return
    }

    const fileSystem = uni.getFileSystemManager()
    fileSystem.saveFile({
      tempFilePath,
      success(result) {
        resolve(result.savedFilePath)
      },
      fail: reject,
    })
  })
}

export async function choosePersistentImage() {
  const tempFilePath = await chooseImagePath()
  return saveImagePath(tempFilePath)
}
