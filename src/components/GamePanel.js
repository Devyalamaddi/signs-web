import React, { useState, useEffect } from "react";
import { trainingData } from "../data/training.data";
import {
  getMultiLevelClassifier,
  buildFeatureVector,
} from "../service/classification.service";
import { GAME_STATES, LABEL_VS_INDEX } from "../utils/constants";

const GamePanel = ({
  handData,
  sendSignToParent,
  sendGameStatusToParent,
  gameStatus: masterGameStatus,
  expectedSign,
  moveToNext
}) => {
  const [clf, setClf] = useState(null);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    const Xtrain = [];
    const ytrain = [];

    trainingData.forEach((td) => {
      const [y, ...x] = td;
      ytrain.push(y);
      Xtrain.push(x);
    });

    const classifier = getMultiLevelClassifier(Xtrain, ytrain);
    setClf(classifier);
  }, []);

  useEffect(() => {
    if (handData && clf && masterGameStatus !== GAME_STATES.won) {
      const landmarks = handData[0]?.landmarks ?? null;
      const [featureVector, angles] = buildFeatureVector(landmarks);

      if (featureVector) {
        const currentPrediction = clf.predict(featureVector, angles);
        setPrediction(currentPrediction);
        sendSignToParent(currentPrediction);
      }
    }
  }, [handData, clf, masterGameStatus, sendSignToParent]);

  useEffect(() => {
    if (expectedSign && expectedSign === prediction) {
      sendGameStatusToParent(GAME_STATES.won);
    }
  }, [expectedSign, prediction, sendGameStatusToParent]);

  return (
    <div style={{ alignContent: "center", textAlign: "center" }}>
      <img
        src={`${process.env.PUBLIC_URL}${expectedSign}.jpg`}
        className="rounded"
        style={{
          display: "block",
          marginLeft: "auto",
          marginRight: "auto",
          width: "100%",
        }}
        alt="Expected sign"
      />
      <p style={{ textAlign: "center", fontSize: "50px", color: "#eb8c34" }}>
        {expectedSign ? LABEL_VS_INDEX[expectedSign].split(" ")[1] : null}
      </p>
      <button
        type="button"
        className="btn btn-outline-primary"
        onClick={moveToNext}
      >
        Skip
      </button>
    </div>
  );
};

export default GamePanel;
