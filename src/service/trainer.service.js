import axios from "axios"
const UPLOAD_INTERVAL = 1000
BE_BASE_URL = ""
export function cropAndSend(datas, crop) {
    var img = document.createElement('img');
    img.onload = function () {
        const dataURI = cropImage(img, crop)
        uploadCroppedImage(dataURI)
    };
    img.src = datas;
}

const cropImage = (image, crop) => {
    const cropWidth = crop.x2 - crop.x1
    const cropHeight = crop.y2 - crop.y1
    const canvas = document.createElement('canvas');
    const scaleX = 1;
    const scaleY = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'blue'

    const pixelRatio = window.devicePixelRatio;
    canvas.width = cropWidth * pixelRatio;
    canvas.height = cropHeight * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    const offsetPixels = 30
    // ref: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
    ctx.drawImage(
        image,
        crop.x1 * scaleX - offsetPixels,
        crop.y1 * scaleY - offsetPixels,
        cropWidth * scaleX + offsetPixels,
        cropHeight * scaleY + offsetPixels,
        0,
        0,
        cropWidth * scaleX + offsetPixels,
        cropHeight * scaleY + offsetPixels,
    );

    // Converting to base64
    const base64Image = canvas.toDataURL("image/jpeg");
    return base64Image
}

const uploadCroppedImage = (dataURI, expected, detected) => {
    console.log(`Sending data to back end ${dataURI}`)
    let formData = new FormData();

    formData.append("expected", expected);
    formData.append("detected", detected);
    formData.append("file", dataURI);
   
    axios
      .post(`${BE_BASE_URL}/api/pose-data`, formData, {
        headers: {
        //   "x-access-token": this.state.user.token,
        //   "orgid": this.state.user.orgId,
        }
      })
      .then(res => {})
      .catch(err => {});
}

