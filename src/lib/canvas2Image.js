module.exports = (image, canvasData) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = canvasData.width
  canvas.height = canvasData.height
  context.drawImage(image, canvasData.imageLeft, canvasData.imageTop, canvasData.imageWidth, canvasData.imageHeight, 0, 0, canvasData.width, canvasData.height)
  return canvas.toDataURL()
}
