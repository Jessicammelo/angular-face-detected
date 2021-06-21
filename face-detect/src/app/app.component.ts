import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

import * as faceapi from '@sam-senior/face-api/dist/face-api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'face-detect';

  @ViewChild('cameraVideo') public cameraVideoElRef: ElementRef;
  @ViewChild('faceRecognitionCanvasElRef')
  public faceRecognitionCanvasElRef: ElementRef;
  @ViewChild('faceFrameCanvasElRef') public faceFrameCanvasElRef: ElementRef;

  private inputSize = 256;
  private scoreThreshold = 0.5;

  private videoEl: HTMLVideoElement;
  public expression;

  public imageCropped;

  constructor(
    private http: HttpClient
  ) { }

  ngAfterViewInit(): void {
    this.faceDetect();
  }

  private async faceDetect() {
    this.videoEl = this.cameraVideoElRef.nativeElement as HTMLVideoElement;
    await faceapi.nets.tinyFaceDetector.loadFromUri('/assets/weights/');
    await faceapi.nets.faceExpressionNet.loadFromUri('/assets/weights/');
    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
    this.videoEl.srcObject = videoStream;
    this.videoEl.onload = () => {
      this.videoEl.width = 640;
      this.videoEl.height = 480;
    }
    setInterval(async () => {
      this.processImage();
    }, 250)
  }

  public getFaceDetectionOptions() {
    const inputSize = this.inputSize;
    const scoreThreshold = this.scoreThreshold;
    return new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold });
  }

  public async processImage() {
    const faces = await faceapi.detectAllFaces(
      this.videoEl,
      this.getFaceDetectionOptions()
      ).withFaceExpressions();


    console.log(faces);


    if (!faces) {
      return;
    }

    this.imageCropped = [];
    faces.forEach(async face => {
      let expression = 0;
      Object.keys(face.expressions).forEach(item => {
        if (expression < face.expressions[item]) {
          expression = face.expressions[item];
          this.expression = item;
        }
      })
      face = face.detection;
      const faceFoundRect = {
        left: face.box._x,
        top: face.box._y - 50,
        width: face.box._width,
        height: face.box._height + 100
      };

      const videoContentCanvas = document.createElement('canvas');
      videoContentCanvas.width = this.videoEl.width;
      videoContentCanvas.height = this.videoEl.height;
      const ctx = videoContentCanvas.getContext('2d');
      ctx.drawImage(
        this.videoEl,
        0, 0, this.videoEl.width, this.videoEl.height
      );

      const faceCrop = ctx.getImageData(
        faceFoundRect.left,
        faceFoundRect.top,
        faceFoundRect.width,
        faceFoundRect.height
      );

      const img = await createImageBitmap(faceCrop);

      const targetCanvas = document.createElement('canvas');
      targetCanvas.width = faceCrop.width;
      targetCanvas.height = faceCrop.height;
      const targetCtx = targetCanvas.getContext('2d');
      targetCtx.drawImage(img, 0, 0);
      this.imageCropped.push(targetCanvas.toDataURL('image/jpeg', 0.9));
    });

  }

}
