import React, { useState, useEffect } from 'react';
import { trainingData } from '../data/training.data';
import {
    getMultiLevelClassifier, buildFeatureVector,
} from '../service/classification.service';
import Validator from './Validator';
import { GAME_STATES, LABEL_VS_INDEX } from '../utils/constants';

export default function GamePanel(props) {
    const [clf, setClf] = useState('');

    useEffect(() => {
        // You need to restrict it at some point
        // This is just dummy code and should be replaced by actual
        if (!clf) {
            setClassifier();
        }
    }, []);

    const setClassifier = async () => {
        const Xtrain = []
        const ytrain = []
        for (let i = 0; i < trainingData.length; i++) {
            const td = trainingData[i]
            ytrain[i] = td.shift()
            Xtrain[i] = td
        }
        setClf(getMultiLevelClassifier(Xtrain, ytrain))
    }

    const handData = props.handData
    const sendSignToParent = props.sendSignToParent
    const sendGameStatusToParent = props.sendGameStatusToParent

    let prediction
    if (handData) {
        const landmarks = handData.length > 0 ? handData[0].landmarks : null
        const fv = buildFeatureVector(landmarks)
        const featureVector = fv[0]
        const angles = fv[1]
        if (featureVector) {
            prediction = clf.predict(featureVector, angles)
            sendSignToParent(prediction)
        }
    }

    // TODO: Move this block to a game controller
    const expectedSign = 1
    expectedSign == prediction ? sendGameStatusToParent(GAME_STATES.won) : null

    return (
        <div>
            {/* TODO: Remove this div after testing */}
            <div style={{ fontSize: "100px" }} className="row">
                {prediction ? LABEL_VS_INDEX[prediction].split(" ")[1] : ''}
            </div>

            <div style={{ fontSize: "100px" }} className="row">
                <Validator expectedSign={expectedSign} currentSign={prediction} />
            </div>
        </div>
    )
}