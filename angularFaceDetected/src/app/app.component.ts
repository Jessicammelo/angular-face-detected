import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import * as faceapi from 'face-api.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'angularFaceDetected';

  @ViewChild("video", { static: false })
  public video: ElementRef;

  @ViewChild("canvas", { static: false })
  public canvas: ElementRef;

  public captures: Array<any>;

  public TINY_FACE_DETECTOR = 'tiny_face_detector';
  // ssd_mobilenetv1 options
  public minConfidence = 0.5

  // tiny_face_detector options
  public inputSize = 512
  public scoreThreshold = 0.5

  public constructor() {
    this.captures = [];
  }

  public ngOnInit() { }

  public async ngAfterViewInit() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        this.video.nativeElement.srcObject = stream;
        this.video.nativeElement.onloadedmetadata = () => {
          this.video.nativeElement.height = 720;
          this.video.nativeElement.width = 1280;
          this.video.nativeElement.style.width = `${this.video.nativeElement.width}px`;
          this.video.nativeElement.style.height = `${this.video.nativeElement.height}px`;
        };
      });
      const result = await faceapi.detectSingleFace(this.video.nativeElement, this.getFaceDetectorOptions());
      const dims = faceapi.matchDimensions(this.canvas.nativeElement, this.video.nativeElement, true);
      faceapi.draw.drawDetections(this.canvas.nativeElement, faceapi.resizeResults(result, dims) as any);
    }
  }

  private getFaceDetectorOptions() {
    const inputSize = this.inputSize;
    const scoreThreshold = this.scoreThreshold;
    return new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
  }

  public capture() {
    var context = this.canvas.nativeElement.getContext("2d").drawImage(this.video.nativeElement, 0, 0);
    this.captures.push(this.canvas.nativeElement.toDataURL("image/png"));
  }


}
