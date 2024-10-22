import { LABEL_VS_INDEX, lrLabels, rfLabels, EDGE_PAIRS_FOR_ANGLES, verticesToIgnore, importantFeatures } from '../utils/constants';
import { OutputFilter, getMode, indexOfMax } from '../utils/helper';
import { rfModel, lrModel } from './models';
import KNN from 'ml-knn';
import { multiply, unitVector, eucDistance, findAngle, radiansToDegrees } from '../utils/math.utils';

function normalizeMovement(landmarks) {
    const origin = landmarks[0];
    return landmarks.map(landmark => [
        landmark[0] - origin[0],
        landmark[1] - origin[1],
        landmark[2] - origin[2]
    ]);
}

export function stopRotationAroundX(landmarks) {
    const point1 = landmarks[0];
    const p5 = landmarks[5];
    const p13 = landmarks[13];
    const p17 = landmarks[17];

    const point2 = [p5[0] + p13[0] + p17[0], p5[1] + p13[1] + p17[1], p5[2] + p13[2] + p17[2]];
    const a = point2[1] - point1[1];
    const b = point2[2] - point1[2];
    const c = Math.sqrt(a * a + b * b);
    const cos = a / c;
    const sin = b / c;

    const rotationMat = [
        [1, 0, 0],
        [0, cos, -sin],
        [0, sin, cos],
    ];

    const rotated = landmarks.map(landmark => multiply([landmark], rotationMat));
    return [rotated.map(r => r[0]), Math.asin(sin)];
}

export function stopRotationAroundY(landmarks) {
    const point1 = landmarks[5];
    const p5 = landmarks[5];
    const p13 = landmarks[13];
    const p17 = landmarks[17];

    const point2 = [p5[0] + p13[0] + p17[0], p5[1] + p13[1] + p17[1], p5[2] + p13[2] + p17[2]];
    const a = point2[0] - point1[0];
    const b = point2[2] - point1[2];
    const c = Math.sqrt(a * a + b * b);
    const cos = a / c;
    const sin = b / c;

    const rotationMat = [
        [cos, 0, -sin],
        [0, 1, 0],
        [sin, 0, cos],
    ];

    const rotated = landmarks.map(landmark => multiply([landmark], rotationMat));
    return [rotated.map(r => r[0]), Math.asin(sin)];
}

export function stopRotationAroundZ(landmarksp) {
    const point1 = landmarksp[0];
    const point2 = landmarksp[9];

    const a = point2[0] - point1[0];
    const b = point2[1] - point1[1];
    const c = Math.sqrt(a * a + b * b);
    const cos = a / c;
    const sin = b / c;

    const rotationMat2 = [
        [cos, -sin, 0],
        [sin, cos, 0],
        [0, 0, 1],
    ];

    const rotated = landmarksp.map(landmark => multiply([landmark], rotationMat2)).map(r => r[0]);
    return [rotated, Math.asin(sin)];
}

export function scaleVertices(landmarks) {
    const wristJoint = landmarks[0];
    const middleFingerBase = landmarks[9];
    const vRefLimbLength = eucDistance(wristJoint, middleFingerBase);
    const vRefUnitVector = unitVector(middleFingerBase, wristJoint);

    const hRef1 = landmarks[5];
    const hRef2 = landmarks[17];
    const hRefLimbLength = eucDistance(hRef1, hRef2);
    const hRefUnitVector = unitVector(hRef2, hRef1);

    const scaleRatioH = 0.7 / hRefLimbLength;
    const scaleRatioV = 1 / vRefLimbLength;

    return landmarks.map(lm => [
        lm[0] * scaleRatioH * hRefUnitVector[0],
        lm[1] * scaleRatioV * vRefUnitVector[1],
        lm[2] * (scaleRatioH + scaleRatioV) / 2
    ]);
}

export function flatten(arr) {
    if (!arr) return arr;
    return arr.reduce((flatted, point) => {
        point.forEach(c => flatted.push(c));
        return flatted;
    }, []);
}

export function unFlatten(flattenCoordinates) {
    return flattenCoordinates.reduce((landmarkPoints, _, i) => {
        if (i % 3 === 0) {
            landmarkPoints.push(flattenCoordinates.slice(i, i + 3));
        }
        return landmarkPoints;
    }, []);
}

export function runPreprocessSteps(landmarks) {
    if (!landmarks) return null;

    const pre2 = normalizeMovement(landmarks);
    const pre3 = stopRotationAroundX(pre2);
    const pre4 = stopRotationAroundZ(pre3[0]);
    const pre5 = stopRotationAroundY(pre4[0]);
    const pre6 = scaleVertices(pre5[0]);

    return [pre6, [pre3[1], pre4[1], pre5[1]]];
}

const oFilter = new OutputFilter();

export class MultiLevelClassifier {
    constructor(Xtrain, ytrain) {
        this.model = new KNN(Xtrain, ytrain, { k: 3 });
    }

    normalizedMax(rawOutput) {
        const sum = rawOutput.reduce((total, val) => total + val, 0);
        return rawOutput.map(val => val / sum);
    }

    getPredictionRF(rawOutput) {
        const smPredLR = this.normalizedMax(rawOutput);
        return indexOfMax(smPredLR);
    }

    getPredictionLR(rawOutput) {
        const min = Math.min(...rawOutput);
        const ro = rawOutput.map(e => e - min);
        const smPredLR = this.normalizedMax(ro);
        return indexOfMax(smPredLR);
    }

    ensemblePredict(featureVector) {
        const results = [];
        const rawPredLR = lrModel(featureVector);
        const predLR = this.getPredictionLR(rawPredLR);
        const rawPredRF = rfModel(featureVector);
        const predRF = this.getPredictionRF(rawPredRF);

        // Dirty tricks to catch none class
        if (predRF[1] < 0.3) return null;
        if ((predRF[0] === 0 || predRF[0] === 12) && predRF[1] < 0.72) return null;

        const predIndexKNN = this.model.predict(featureVector);
        results.push(rfLabels[predRF[0]]);
        results.push(lrLabels[predLR[0]]);
        results.push(predIndexKNN);
        return getMode(results);
    }

    ensemblePredict2(dataset) {
        const rawPredLR = lrModel(dataset);
        const predLR = this.getPredictionRF(rawPredLR);
        if (predLR[1] > 0.67) {
            return lrLabels[predLR[0]];
        } else if (predLR[1] < 0.2) {
            return null;
        } else {
            const results = [];
            const rawPredRF = rfModel(dataset);
            const predRF = this.getPredictionRF(rawPredRF);
            if (predRF[1] > 0.67) {
                return rfLabels[predRF[0]];
            }
            const predIndexKNN = this.model.predict(dataset);
            if (predRF[1] > 0.5 && predLR[1] > 0.5) {
                results.push(rfLabels[predRF[0]]);
                results.push(lrLabels[predLR[0]]);
                results.push(predIndexKNN);
                return getMode(results);
            }
        }
    }

    predict(featureVector, angles) {
        const predIndex = this.ensemblePredict(featureVector);
        if (predIndex) {
            const idx = oFilter.filter(predIndex);
            if (idx && idx > 0) {
                const predSignL2 = classifyRuleBased(idx, angles);
                return predSignL2;
            } else return null;
        } else return null;
    }
}

function classifyRuleBased(pred, angles) {
    let z_rotation = null;
    let sign = null;
    if (pred === 7 || pred === 27) {
        z_rotation = radiansToDegrees(angles[1]);
        return z_rotation > 45 ? 27 : 7;
    }
    if (pred === 1) {
        sign = classifySignRule(angles);
        return sign > 0 ? 27 : 1;
    }
    return pred;
}

function classifySignRule(angles) {
    const index = angles.findIndex(x => x > 45);
    return index === -1 ? -1 : index + 1;
}

export function getFeatureVectors(landmarks) {
    const processedLandmarks = runPreprocessSteps(landmarks);
    if (!processedLandmarks) return null;

    const featureVectors = [];

    const features = processedLandmarks[0].map(lm => [
        lm[0],
        lm[1],
        lm[2],
        ...EDGE_PAIRS_FOR_ANGLES.map(edge => findAngle(processedLandmarks[0][edge[0]], processedLandmarks[0][edge[1]])),
        ...importantFeatures
    ]);

    return flatten(features);
}
