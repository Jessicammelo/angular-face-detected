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
    await this.http.get('http://192.168.15.73:5000//start_liveness_detection').toPromise();
    setInterval(async () => {
      const faceDetected = await this.http.get('http://192.168.15.73:5000//get_person_face').toPromise() as any;
      if (faceDetected.has_face) {
        this.processImage(faceDetected.image);
      }
    }, 250)
  }

  public getFaceDetectionOptions() {
    const inputSize = this.inputSize;
    const scoreThreshold = this.scoreThreshold;
    return new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold });
  }

  public async processImage(base64Image) {
    this.videoEl.src = `data:image/png;base64,${base64Image}`;
    this.videoEl.onload = async () => {
      const face = await faceapi.detectSingleFace(
        this.videoEl,
        this.getFaceDetectionOptions()
      );

      console.log(face);


      if (!face) {
        return;
      }

      const faceFoundRect = {
        left: face.box._x - 25,
        top: face.box._y - 110,
        width: face.box._width + 50,
        height: face.box._height + 120
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
      this.imageCropped = targetCanvas.toDataURL('image/jpeg', 0.9);
    }
  }
}
