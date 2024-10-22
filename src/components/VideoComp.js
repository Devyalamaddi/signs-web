import React, { useState, useEffect, useRef } from "react";
import * as handpose from "@tensorflow-models/handpose";
import Webcam from "react-webcam";
import "@tensorflow/tfjs-backend-webgl";
import LinearProgress from "@material-ui/core/LinearProgress";
import { getPose2 } from "../service/detector.service";
import { GAME_STATES } from "../utils/constants";
import { cropAndSend } from "../service/trainer.service";

const UPLOAD_INTERVAL = 2000;

// Dummy values for expected and current
const expected = 1;
const current = 1;

export default function VideoComp({ sendDataToParent, gameStatus, sendData, isMobile }) {
  const [cameraHidden, setCameraHidden] = useState(true);
  const [pausedImage, setPausedImage] = useState(null);
  const webcamRef = useRef();
  const [sendFlag, setSendFlag] = useState(true);

  const uploadPoses = async () => {
    if (webcamRef.current?.video.readyState === 4 && sendFlag) {
      const lmEst = await getPose2(webcamRef.current.video, false);
      if (lmEst && lmEst.length > 0) {
        const bbox = lmEst[0].boundingBox;
        if (bbox) {
          const crop = {
            x1: bbox.topLeft[0],
            y1: bbox.topLeft[1],
            x2: bbox.bottomRight[0],
            y2: bbox.bottomRight[1],
          };
          captureAndSend(crop);
        }
      }
    }
    setTimeout(uploadPoses, UPLOAD_INTERVAL);
  };

  const captureAndSend = (crop) => {
    const image = webcamRef.current.getScreenshot();
    cropAndSend(image, crop, expected, current);
  };

  const capture = () => {
    if (!pausedImage) {
      const image = webcamRef.current.getScreenshot();
      setPausedImage(image);
    }
  };

  const detect = async () => {
    if (webcamRef.current?.video.readyState === 4) {
      const poseEstimateResult = await getPose2(webcamRef.current.video, isMobile);
      sendDataToParent(poseEstimateResult);
      if (cameraHidden) {
        setCameraHidden(false);
      }
    }
    setTimeout(detect, 100);
  };

  useEffect(() => {
    const runHandpose = async () => {
      await handpose.load();
      detect();
      uploadPoses();
    };
    runHandpose();
  }, []);

  useEffect(() => {
    setSendFlag(!sendData);
  }, [sendData]);

  const videoWidth = gameStatus === GAME_STATES.won || cameraHidden ? 0 : "100%";

  const videoC = (
    <Webcam
      ref={webcamRef}
      screenshotFormat="image/jpeg"
      style={{
        width: videoWidth,
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
      }}
      className="rounded"
      mirrored={true}
    />
  );

  let videoP = null;
  if (gameStatus === GAME_STATES.won) {
    if (!pausedImage) capture();
    videoP = (
      <img
        src={pausedImage}
        className="rounded"
        style={{
          visibility: cameraHidden ? "hidden" : "visible",
          width: "100%",
        }}
        alt="Paused"
      />
    );
    setTimeout(() => setPausedImage(null), 3000);
  }

  const correctSign = gameStatus === GAME_STATES.won && (
    <img
      src={`${process.env.PUBLIC_URL}correct.png`}
      style={{
        width: "25%",
        position: "absolute",
        top: "50%",
        left: "45%",
      }}
      alt="Correct Sign"
    />
  );

  return (
    <div>
      {cameraHidden && (
        <div className="Outer">
          <div className="Spacer" />
          <p>Loading. Please wait.</p>
          <LinearProgress />
        </div>
      )}
      <div>
        {videoC}
        {videoP}
        {correctSign}
      </div>
    </div>
  );
}
